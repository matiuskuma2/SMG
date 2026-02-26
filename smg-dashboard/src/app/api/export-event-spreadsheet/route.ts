import type { EventData, Participant } from '@/components/event/types';
import { createClient } from '@/lib/supabase/server';
import type { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

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

    console.log('===========');
    console.log(eventParticipants);
    console.log('===========');
    console.log(partyParticipants);
    console.log('===========');
    console.log(consultationParticipants);
    console.log('===========');
    console.log(eventData);
    console.log('===========');

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

    // 既存のスプレッドシートIDがあるかチェック
    let spreadsheetId: string | undefined;

    if (eventData.spreadsheet_id) {
      try {
        // 既存のスプレッドシートが存在するかチェック
        await sheets.spreadsheets.get({
          spreadsheetId: eventData.spreadsheet_id,
        });
        spreadsheetId = eventData.spreadsheet_id;
        console.log(`既存のスプレッドシートID: ${spreadsheetId}`);

        // 既存のスプレッドシートの内容をクリア
        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range: 'イベント!A1:Z1000',
        });
        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range: '懇親会!A1:Z1000',
        });
        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range: '個別相談会!A1:Z1000',
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
    const supabase = createClient();
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
