import { createAdminClient } from '@/lib/supabase/admin';
import { type NextRequest, NextResponse } from 'next/server';

// バナー並び替え保存
export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { banner_orders } = body;

    if (!banner_orders || !Array.isArray(banner_orders)) {
      return NextResponse.json(
        { error: '並び順データが無効です' },
        { status: 400 },
      );
    }

    // 各バナーの sort_order を更新
    for (const order of banner_orders) {
      const { error } = await (supabase as any)
        .from('mst_banner')
        .update({
          sort_order: order.sort_order,
          updated_at: new Date().toISOString(),
        })
        .eq('banner_id', order.banner_id);

      if (error) {
        console.error('バナー並び替えエラー:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('バナー並び替えエラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '並び替えの保存に失敗しました' },
      { status: 500 },
    );
  }
}
