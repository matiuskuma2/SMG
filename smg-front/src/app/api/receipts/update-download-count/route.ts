import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// ダウンロード回数制限（2回）
const MAX_DOWNLOAD_COUNT = 2;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, userId } = body;

    // 必須パラメータの検証
    if (!eventId || !userId) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 現在のダウンロード回数を取得
    const { data: currentData, error: fetchError } = await supabase
      .from('trn_gather_attendee')
      .select('receipt_download_count')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (fetchError) {
      console.error('ダウンロード回数の取得に失敗しました:', fetchError);
      return NextResponse.json(
        { error: 'ダウンロード回数の取得に失敗しました' },
        { status: 500 }
      );
    }

    const currentCount = currentData?.receipt_download_count || 0;

    // ダウンロード回数制限チェック
    if (currentCount >= MAX_DOWNLOAD_COUNT) {
      return NextResponse.json(
        { error: `ダウンロード回数の上限（${MAX_DOWNLOAD_COUNT}回）に達しています` },
        { status: 400 }
      );
    }

    // ダウンロード回数を更新
    const newDownloadCount = currentCount + 1;
    const { error: updateError } = await supabase
      .from('trn_gather_attendee')
      .update({ 
        receipt_download_count: newDownloadCount,
        updated_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (updateError) {
      console.error('ダウンロード回数の更新に失敗しました:', updateError);
      return NextResponse.json(
        { error: 'ダウンロード回数の更新に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      downloadCount: newDownloadCount,
      remainingCount: MAX_DOWNLOAD_COUNT - newDownloadCount,
      maxCount: MAX_DOWNLOAD_COUNT,
      message: 'ダウンロード回数が更新されました',
    });

  } catch (error) {
    console.error('ダウンロード回数更新エラー:', error);
    return NextResponse.json(
      { error: 'ダウンロード回数の更新に失敗しました' },
      { status: 500 }
    );
  }
} 