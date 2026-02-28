import { createAdminClient } from '@/lib/supabase/admin';
import { type NextRequest, NextResponse } from 'next/server';

// タブ並び替え
export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { tab_orders } = body;

    // バリデーション
    if (!Array.isArray(tab_orders) || tab_orders.length === 0) {
      return NextResponse.json(
        { error: 'tab_orders は配列で指定してください' },
        { status: 400 },
      );
    }

    // 各タブの display_order を更新
    const updatePromises = tab_orders.map(
      (item: { tab_id: string; display_order: number }) =>
        (supabase
          .from('mst_tab') as any)
          .update({ display_order: item.display_order })
          .eq('tab_id', item.tab_id)
          .is('deleted_at', null),
    );

    const results = await Promise.all(updatePromises);

    // エラーチェック
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error('並び替えエラー:', errors.map((e) => e.error));
      return NextResponse.json(
        { error: '一部のタブの並び替えに失敗しました' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, message: 'タブの並び替えを更新しました' });
  } catch (error) {
    console.error('タブ並び替えエラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'タブの並び替えに失敗しました' },
      { status: 500 },
    );
  }
}
