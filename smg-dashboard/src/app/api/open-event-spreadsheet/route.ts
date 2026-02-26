import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId }: { eventId: string } = body;

    if (!eventId) {
      return NextResponse.json(
        { message: 'イベントIDが指定されていません' },
        { status: 400 },
      );
    }

    // データベースからspreadsheet_idを取得
    const supabase = createClient();
    const { data: eventData, error } = await supabase
      .from('mst_event')
      .select('spreadsheet_id')
      .eq('event_id', eventId)
      .single();

    if (error) {
      console.error('データベース取得エラー:', error);
      return NextResponse.json(
        { message: 'イベントデータの取得に失敗しました' },
        { status: 500 },
      );
    }

    if (!eventData?.spreadsheet_id) {
      return NextResponse.json(
        { message: 'スプレッドシートがまだ作成されていません' },
        { status: 404 },
      );
    }

    // GoogleスプレッドシートのURLを生成
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${eventData.spreadsheet_id}`;

    return NextResponse.json({
      message: 'スプレッドシートを開きます',
      spreadsheetUrl,
    });
  } catch (err) {
    console.error('Error opening spreadsheet:', err);
    return NextResponse.json(
      { message: 'スプレッドシートを開くのに失敗しました' },
      { status: 500 },
    );
  }
}
