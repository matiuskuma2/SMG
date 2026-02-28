import { createAdminClient } from '@/lib/supabase/admin';
import { type NextRequest, NextResponse } from 'next/server';

// タブ詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createAdminClient();
    const tabId = params.id;

    const { data: tab, error } = await (supabase as any)
      .from('mst_tab')
      .select(`
        *,
        trn_tab_visible_group!left(
          id,
          group_id,
          mst_group!inner(group_id, title)
        )
      `)
      .eq('tab_id', tabId)
      .is('deleted_at', null)
      .single();

    if (error || !tab) {
      return NextResponse.json(
        { error: 'タブが見つかりません' },
        { status: 404 },
      );
    }

    const formattedTab = {
      ...tab,
      visible_groups: (tab.trn_tab_visible_group || [])
        .filter((vg: any) => vg.mst_group)
        .map((vg: any) => ({
          id: vg.id,
          group_id: vg.group_id,
          group_title: vg.mst_group.title,
        })),
      trn_tab_visible_group: undefined,
    };

    return NextResponse.json({ tab: formattedTab });
  } catch (error) {
    console.error('タブ詳細取得エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'タブの取得に失敗しました' },
      { status: 500 },
    );
  }
}

// タブ更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createAdminClient();
    const tabId = params.id;
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

    // タブ更新
    const { data: updatedTab, error: updateError } = await (supabase as any)
      .from('mst_tab')
      .update({
        display_name,
        link_type,
        link_value,
        display_order: display_order || 0,
        status: status || 'draft',
        is_visible_to_all: is_visible_to_all !== false,
      })
      .eq('tab_id', tabId)
      .is('deleted_at', null)
      .select()
      .single();

    if (updateError) {
      console.error('タブ更新エラー:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 表示グループの更新
    // 既存のグループ関連を論理削除
    await (supabase as any)
      .from('trn_tab_visible_group')
      .update({ deleted_at: new Date().toISOString() })
      .eq('tab_id', tabId)
      .is('deleted_at', null);

    // 新しいグループ関連を挿入（is_visible_to_all が false の場合）
    if (!is_visible_to_all && visible_group_ids && visible_group_ids.length > 0) {
      const groupInserts = visible_group_ids.map((group_id: string) => ({
        tab_id: tabId,
        group_id,
      }));

      const { error: groupError } = await (supabase as any)
        .from('trn_tab_visible_group')
        .insert(groupInserts);

      if (groupError) {
        console.error('表示グループ更新エラー:', groupError);
      }
    }

    return NextResponse.json({ tab: updatedTab });
  } catch (error) {
    console.error('タブ更新エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'タブの更新に失敗しました' },
      { status: 500 },
    );
  }
}

// タブ削除（論理削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createAdminClient();
    const tabId = params.id;

    // タブを論理削除
    const { error: deleteError } = await (supabase as any)
      .from('mst_tab')
      .update({ deleted_at: new Date().toISOString() })
      .eq('tab_id', tabId)
      .is('deleted_at', null);

    if (deleteError) {
      console.error('タブ削除エラー:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 関連する visible_group も論理削除
    await (supabase as any)
      .from('trn_tab_visible_group')
      .update({ deleted_at: new Date().toISOString() })
      .eq('tab_id', tabId)
      .is('deleted_at', null);

    return NextResponse.json({ success: true, message: 'タブを削除しました' });
  } catch (error) {
    console.error('タブ削除エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'タブの削除に失敗しました' },
      { status: 500 },
    );
  }
}
