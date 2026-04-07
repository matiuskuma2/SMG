import { createClient } from '@/lib/supabase/server';
import type {
  IndividualConsultationFormType,
  Participant,
} from '@/types/individualConsultation';
import type { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// 回答データを表示用文字列に変換するヘルパー関数
function formatAnswer(
  answer:
    | string
    | boolean
    | string[]
    | number
    | {
        text?: string;
        value?: string | number | boolean;
        boolean?: boolean;
        selected?: string[];
      }
    | null
    | undefined,
  questionType?: string,
): string {
  if (answer === null || answer === undefined) return '';

  if (typeof answer === 'string') return answer;
  if (typeof answer === 'number') return String(answer);
  if (typeof answer === 'boolean') return answer ? 'はい' : 'いいえ';
  if (Array.isArray(answer)) return answer.join(', ');

  // オブジェクト型の回答
  if (typeof answer === 'object') {
    if (questionType === 'boolean' && answer.boolean !== undefined) {
      return answer.boolean ? 'はい' : 'いいえ';
    }
    if (answer.selected && Array.isArray(answer.selected)) {
      return answer.selected.join(', ');
    }
    if (answer.text !== undefined) return String(answer.text);
    if (answer.value !== undefined) return String(answer.value);
    // フォールバック: JSONとして出力
    return JSON.stringify(answer);
  }

  return String(answer);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      participants,
      individualConsultation,
    }: {
      participants: Participant[];
      individualConsultation?: IndividualConsultationFormType;
    } = body;

    if (!participants || !Array.isArray(participants)) {
      return NextResponse.json(
        { message: 'Invalid participants data' },
        { status: 400 },
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    const authClient: JWT = (await auth.getClient()) as JWT;
    const drive = google.drive({ version: 'v3', auth: authClient });
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const folderId = process.env.GOOGLE_FOLDER_ID;

    if (!folderId) {
      throw new Error(
        'フォルダIDが環境変数に設定されていません (GOOGLE_FOLDER_ID)',
      );
    }

    const spreadsheetName = individualConsultation?.title || '参加者リスト';
    console.log('スプレッドシート名:', spreadsheetName);

    // ========== 追加質問と回答をSupabaseから取得 ==========
    const supabase = createClient();

    let questions: {
      question_id: string;
      title: string;
      question_type: string;
      display_order: number;
    }[] = [];
    let answersMap: Map<string, Map<string, string>> = new Map(); // application_id -> (questionId -> formattedAnswer)

    if (individualConsultation?.consultation_id) {
      // 個別相談に紐づく追加質問を取得（display_order順）
      const { data: consultationQuestions, error: questionsError } =
        await supabase
          .from('trn_consultation_question')
          .select('question_id, title, question_type, display_order')
          .eq('consultation_id', individualConsultation.consultation_id)
          .is('deleted_at', null)
          .order('display_order', { ascending: true });

      if (questionsError) {
        console.error('追加質問取得エラー:', questionsError);
      }

      questions = consultationQuestions || [];
      const questionIds = questions.map((q) => q.question_id);

      // 全参加者のapplication_idを収集
      const allApplicationIds = participants
        .map((p) => p.application_id)
        .filter(Boolean);

      // 全参加者の回答を一括取得
      if (questionIds.length > 0 && allApplicationIds.length > 0) {
        const { data: allAnswers, error: answersError } = await supabase
          .from('trn_consultation_question_answer')
          .select('application_id, question_id, answer')
          .in('question_id', questionIds)
          .in('application_id', allApplicationIds)
          .is('deleted_at', null);

        if (answersError) {
          console.error('回答取得エラー:', answersError);
        }

        if (allAnswers) {
          for (const ans of allAnswers) {
            if (!answersMap.has(ans.application_id)) {
              answersMap.set(ans.application_id, new Map());
            }
            const question = questions.find(
              (q) => q.question_id === ans.question_id,
            );
            answersMap
              .get(ans.application_id)!
              .set(
                ans.question_id,
                formatAnswer(ans.answer, question?.question_type),
              );
          }
        }
      }
    }

    // 追加質問のヘッダー列
    const questionHeaders = questions.map((q) => q.title);

    // 参加者の追加質問回答を配列として取得するヘルパー
    const getAnswerColumns = (applicationId: string): string[] => {
      const appAnswers = answersMap.get(applicationId);
      return questions.map((q) => appAnswers?.get(q.question_id) || '');
    };

    // ========== 既存のスプレッドシートIDがあるかチェック ==========
    let savedSpreadsheetId: string | undefined;
    if (individualConsultation?.consultation_id) {
      const { data: consultationData, error } = await supabase
        .from('mst_consultation')
        .select('spreadsheet_id')
        .eq('consultation_id', individualConsultation.consultation_id)
        .single();

      if (!error && consultationData?.spreadsheet_id) {
        savedSpreadsheetId = consultationData.spreadsheet_id;
        console.log(
          `データベースから取得したスプレッドシートID: ${savedSpreadsheetId}`,
        );
      }
    }

    let spreadsheetId: string | undefined;

    if (savedSpreadsheetId) {
      try {
        await sheets.spreadsheets.get({
          spreadsheetId: savedSpreadsheetId,
        });
        spreadsheetId = savedSpreadsheetId;
        console.log(`既存のスプレッドシートID: ${spreadsheetId}`);

        // 追加質問カラム分を考慮して広範囲をクリア
        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range: 'Sheet1!A1:ZZ10000',
        });
      } catch (error) {
        console.log(
          '保存されたスプレッドシートIDが見つかりません。新規作成します。',
        );
        spreadsheetId = undefined;
      }
    }

    if (!spreadsheetId) {
      const file = await drive.files.create({
        requestBody: {
          name: spreadsheetName,
          mimeType: 'application/vnd.google-apps.spreadsheet',
          parents: [folderId],
        },
        fields: 'id',
        supportsAllDrives: true,
      });

      if (!file.data.id) {
        throw new Error('新規スプレッドシートIDが取得できませんでした');
      }
      spreadsheetId = file.data.id;
      console.log(`✅ 新規作成されたスプレッドシートID: ${spreadsheetId}`);
    }

    if (!spreadsheetId) {
      throw new Error('スプレッドシートIDが取得できませんでした');
    }

    // ========== シートデータ作成（追加質問カラムを含む） ==========
    const values = [
      [
        '名前',
        'メール',
        '電話番号',
        '属性',
        '初回相談',
        '当選日時',
        '候補日時(第1希望)',
        '候補日時(第2希望)',
        '候補日時(第3希望)',
        '備考',
        ...questionHeaders,
      ],
      ...participants.map((p) => {
        const sortedDates = [...p.candidateDateAndTime].sort(
          (a, b) => (a.candidateRanking ?? 0) - (b.candidateRanking ?? 0),
        );

        const selectedDate =
          p.candidateDateAndTime.find(
            (c) => c.schedule_id === p.selected_candidate_id,
          )?.schedule_datetime || '';

        return [
          p.username,
          p.email,
          p.phone_number,
          p.user_type,
          p.firstTime ? '初回' : '再訪',
          selectedDate,
          sortedDates[0]?.schedule_datetime || '',
          sortedDates[1]?.schedule_datetime || '',
          sortedDates[2]?.schedule_datetime || '',
          p.remarks || '',
          ...getAnswerColumns(p.application_id),
        ];
      }),
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });

    if (individualConsultation?.consultation_id) {
      const { error: updateError } = await supabase
        .from('mst_consultation')
        .update({ spreadsheet_id: spreadsheetId })
        .eq('consultation_id', individualConsultation.consultation_id);

      if (updateError) {
        console.error('データベース更新エラー:', updateError);
      }
    }

    return NextResponse.json({
      message: savedSpreadsheetId
        ? 'スプレッドシートが更新されました！'
        : 'スプレッドシートが作成されました！',
      spreadsheetId,
    });
  } catch (error) {
    console.error('Error exporting spreadsheet:', error);
    return NextResponse.json(
      { message: 'スプレッドシート作成に失敗しました' },
      { status: 500 },
    );
  }
}
