import type { EventData, Participant } from '@/components/event/types';
import { createClient } from '@/lib/supabase/server';
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
      eventParticipants,
      partyParticipants,
      consultationParticipants,
      eventData,
    }: {
      eventParticipants: Participant[];
      partyParticipants: Participant[];
      consultationParticipants: Participant[];
      eventData: EventData;
    } = body;

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

    // ========== 追加質問と回答をSupabaseから取得 ==========
    const supabase = createClient();

    // イベントに紐づく追加質問を取得（display_order順）
    const { data: eventQuestions, error: questionsError } = await supabase
      .from('trn_event_question')
      .select('question_id, title, question_type, display_order')
      .eq('event_id', eventData.event_id)
      .is('deleted_at', null)
      .order('display_order', { ascending: true });

    if (questionsError) {
      console.error('追加質問取得エラー:', questionsError);
    }

    const questions = eventQuestions || [];
    const questionIds = questions.map((q) => q.question_id);

    // 全参加者のuser_idを収集
    const allUserIds = [
      ...new Set([
        ...eventParticipants.map((p) => p.userId),
        ...partyParticipants.map((p) => p.userId),
        ...consultationParticipants.map((p) => p.userId),
      ]),
    ];

    // 全参加者の回答を一括取得
    let answersMap: Map<string, Map<string, string>> = new Map(); // userId -> (questionId -> formattedAnswer)

    if (questionIds.length > 0 && allUserIds.length > 0) {
      const { data: allAnswers, error: answersError } = await supabase
        .from('trn_event_question_answer')
        .select('user_id, question_id, answer')
        .in('question_id', questionIds)
        .in('user_id', allUserIds)
        .is('deleted_at', null);

      if (answersError) {
        console.error('回答取得エラー:', answersError);
      }

      if (allAnswers) {
        for (const ans of allAnswers) {
          if (!answersMap.has(ans.user_id)) {
            answersMap.set(ans.user_id, new Map());
          }
          const question = questions.find(
            (q) => q.question_id === ans.question_id,
          );
          answersMap
            .get(ans.user_id)!
            .set(
              ans.question_id,
              formatAnswer(ans.answer as Parameters<typeof formatAnswer>[0], question?.question_type),
            );
        }
      }
    }

    // 追加質問のヘッダー列
    const questionHeaders = questions.map((q) => q.title);

    // 参加者の追加質問回答を配列として取得するヘルパー
    const getAnswerColumns = (userId: string): string[] => {
      const userAnswers = answersMap.get(userId);
      return questions.map((q) => userAnswers?.get(q.question_id) || '');
    };

    // ========== 既存のスプレッドシートIDがあるかチェック ==========
    let spreadsheetId: string | undefined;

    if (eventData.spreadsheet_id) {
      try {
        // 既存のスプレッドシートが存在するかチェック
        await sheets.spreadsheets.get({
          spreadsheetId: eventData.spreadsheet_id,
        });
        spreadsheetId = eventData.spreadsheet_id;
        console.log(`既存のスプレッドシートID: ${spreadsheetId}`);

        // 既存のスプレッドシートの内容をクリア（追加質問カラム分を考慮して広範囲をクリア）
        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range: 'イベント!A1:ZZ10000',
        });
        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range: '懇親会!A1:ZZ10000',
        });
        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range: '個別相談会!A1:ZZ10000',
        });
      } catch (error) {
        console.log(
          '保存されたスプレッドシートIDが見つかりません。新規作成します。',
        );
        // 保存されたIDが無効な場合は新規作成
        spreadsheetId = undefined;
      }
    }

    if (!spreadsheetId) {
      // 新規スプレッドシートを作成
      const file = await drive.files.create({
        requestBody: {
          name: eventData?.event_name || 'イベント参加者リスト',
          mimeType: 'application/vnd.google-apps.spreadsheet',
          parents: [folderId],
        },
        fields: 'id',
        supportsAllDrives: true,
      });

      if (!file.data.id) {
        throw new Error('スプレッドシートIDの取得に失敗しました');
      }
      spreadsheetId = file.data.id;
      console.log(`✅ 新規作成されたスプレッドシートID: ${spreadsheetId}`);

      // リンクを知っている全員が編集可能に設定
      await drive.permissions.create({
        fileId: spreadsheetId,
        supportsAllDrives: true,
        requestBody: {
          role: 'writer',
          type: 'anyone',
        },
      });
      console.log('✅ リンク共有設定を適用しました');

      // 新規作成時のみシートを追加
      const requests = [
        { addSheet: { properties: { title: 'イベント' } } },
        { addSheet: { properties: { title: '懇親会' } } },
        { addSheet: { properties: { title: '個別相談会' } } },
        { deleteSheet: { sheetId: 0 } }, //不要なシート削除(デフォルトで作成されるもの)
      ];

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests },
      });
    }

    // ========== 各シートのデータ作成（追加質問カラムを含む） ==========
    const eventValues = [
      [
        '名前',
        '会社名',
        '申込状況',
        '参加方法',
        'メールアドレス',
        '電話番号',
        '属性',
        '所属グループ',
        ...questionHeaders,
      ],
      ...eventParticipants.map((p) => [
        p.name,
        p.companyName,
        p.status,
        p.is_offline ? 'オフライン' : 'オンライン',
        p.email,
        p.phone,
        p.userType,
        p.groupAffiliation,
        ...getAnswerColumns(p.userId),
      ]),
    ];

    const partyValues = [
      [
        '名前',
        '会社名',
        '申込状況',
        'メールアドレス',
        '電話番号',
        '属性',
        '所属グループ',
        '決済状況',
        ...questionHeaders,
      ],
      ...partyParticipants.map((p) => [
        p.name,
        p.companyName,
        p.status,
        p.email,
        p.phone,
        p.userType,
        p.groupAffiliation,
        p.paymentStatus === 'succeeded'
          ? '支払い済み'
          : p.paymentStatus === 'refunded'
            ? '返金済み'
            : p.paymentStatus || '',
        ...getAnswerColumns(p.userId),
      ]),
    ];

    const consultationValues = [
      [
        '名前',
        '会社名',
        '申込状況',
        'メールアドレス',
        '電話番号',
        '属性',
        '所属グループ',
        '緊急相談',
        '初回相談',
        ...questionHeaders,
      ],
      ...consultationParticipants.map((p) => [
        p.name,
        p.companyName,
        p.status,
        p.email,
        p.phone,
        p.userType,
        p.groupAffiliation,
        p.is_urgent ? '緊急相談' : '',
        p.is_first_consultation ? '初回相談' : '',
        ...getAnswerColumns(p.userId),
      ]),
    ];

    const updateSheet = async (title: string, values: string[][]) => {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${title}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values },
      });
    };

    await updateSheet('イベント', eventValues);
    await updateSheet('懇親会', partyValues);
    await updateSheet('個別相談会', consultationValues);

    // データベースにspreadsheet_idを更新
    const { error: updateError } = await supabase
      .from('mst_event')
      .update({ spreadsheet_id: spreadsheetId })
      .eq('event_id', eventData.event_id);

    if (updateError) {
      console.error('データベース更新エラー:', updateError);
    }

    return NextResponse.json({
      message: 'スプレッドシートを作成しました！',
      spreadsheetId,
    });
  } catch (err) {
    console.error('Error exporting spreadsheet:', err);
    return NextResponse.json(
      { message: 'スプレッドシート作成に失敗しました' },
      { status: 500 },
    );
  }
}
