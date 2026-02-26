import { createClient } from '@/lib/supabase/server';
import type {
  IndividualConsultationFormType,
  Participant,
} from '@/types/individualConsultation';
import type { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

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

    let savedSpreadsheetId: string | undefined;
    if (individualConsultation?.consultation_id) {
      const supabase = createClient();
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

        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range: 'Sheet1!A1:Z1000',
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
      const supabase = createClient();
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
