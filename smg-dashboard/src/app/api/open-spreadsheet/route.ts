import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { consultationId }: { consultationId: string } = body;

    if (!consultationId) {
      return NextResponse.json(
        { message: '個別相談IDが指定されていません' },
        { status: 400 },
      );
    }

    // データベースからspreadsheet_idを取得
    const supabase = createClient();
    const { data: consultationData, error } = await supabase
      .from('mst_consultation')
      .select('spreadsheet_id')
      .eq('consultation_id', consultationId)
      .single();

    if (error) {
      console.error('データベース取得エラー:', error);
      return NextResponse.json(
        { message: '個別相談データの取得に失敗しました' },
        { status: 500 },
      );
    }

    if (!consultationData?.spreadsheet_id) {
      return NextResponse.json(
        { message: 'スプレッドシートがまだ作成されていません' },
        { status: 404 },
      );
    }

    // GoogleスプレッドシートのURLを生成
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${consultationData.spreadsheet_id}`;

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
