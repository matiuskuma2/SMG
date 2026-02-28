import { createAdminClient } from '@/lib/supabase/admin';
import { type NextRequest, NextResponse } from 'next/server';

const MAX_TABS = 15;

// タブ一覧取得
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: tabs, error } = await (supabase
      .from('mst_tab') as any)
      .select(`
        *,
        trn_tab_visible_group!left(
          id,
          group_id,
          mst_group!inner(group_id, title)
        )
      `)
      .is('deleted_at', null)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('タブ一覧取得エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // visible_group のフィルタリング（deleted_at が null のもののみ）
    const formattedTabs = (tabs || []).map((tab) => ({
      ...tab,
      visible_groups: (tab.trn_tab_visible_group || [])
        .filter((vg: any) => vg.mst_group)
        .map((vg: any) => ({
          id: vg.id,
          group_id: vg.group_id,
          group_title: vg.mst_group.title,
        })),
      trn_tab_visible_group: undefined,
    }));

    return NextResponse.json({ tabs: formattedTabs });
  } catch (error) {
    console.error('タブ一覧取得エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'タブ一覧の取得に失敗しました' },
      { status: 500 },
    );
  }
}

// タブ作成
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { display_name, link_type, link_value, display_order, status, is_visible_to_all, visible_group_ids } = body;

    // バリデーション
    if (!display_name || !link_type || !link_value) {
      return NextResponse.json(
        { error: '表示名、リンク種別、リンク先は必須です' },
        { status: 400 },
      );
    }

    if (!['notice', 'shibu', 'event', 'external', 'internal'].includes(link_type)) {
      return NextResponse.json(
        { error: '無効なリンク種別です' },
        { status: 400 },
      );
    }

    if (!['public', 'draft'].includes(status || 'draft')) {
      return NextResponse.json(
        { error: '無効な公開状態です' },
        { status: 400 },
      );
    }

    // タブ数上限チェック
    const { count, error: countError } = await (supabase
      .from('mst_tab') as any)
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if ((count || 0) >= MAX_TABS) {
      return NextResponse.json(
        { error: `タブは最大${MAX_TABS}件までです` },
        { status: 400 },
      );
    }

    // タブ作成
    const { data: newTab, error: insertError } = await (supabase
      .from('mst_tab') as any)
      .insert({
        display_name,
        link_type,
        link_value,
        display_order: display_order || 0,
        status: status || 'draft',
        is_visible_to_all: is_visible_to_all !== false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('タブ作成エラー:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 表示グループの設定（is_visible_to_all が false の場合）
    if (!is_visible_to_all && visible_group_ids && visible_group_ids.length > 0) {
      const groupInserts = visible_group_ids.map((group_id: string) => ({
        tab_id: newTab.tab_id,
        group_id,
      }));

      const { error: groupError } = await (supabase
        .from('trn_tab_visible_group') as any)
        .insert(groupInserts);

      if (groupError) {
        console.error('表示グループ設定エラー:', groupError);
        // タブ自体は作成済みなのでエラーログのみ
      }
    }

    return NextResponse.json({ tab: newTab }, { status: 201 });
  } catch (error) {
    console.error('タブ作成エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'タブの作成に失敗しました' },
      { status: 500 },
    );
  }
}
