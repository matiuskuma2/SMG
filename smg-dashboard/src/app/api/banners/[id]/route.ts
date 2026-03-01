import { createAdminClient } from '@/lib/supabase/admin';
import { type NextRequest, NextResponse } from 'next/server';

// バナー詳細取得
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createAdminClient();

    const { data: banner, error } = await (supabase as any)
      .from('mst_banner')
      .select('*')
      .eq('banner_id', params.id)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('バナー取得エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!banner) {
      return NextResponse.json({ error: 'バナーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ banner });
  } catch (error) {
    console.error('バナー取得エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'バナーの取得に失敗しました' },
      { status: 500 },
    );
  }
}

// バナー更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { title, image_url, href, sort_order, is_active } = body;

    // バリデーション
    if (!title || !image_url || !href) {
      return NextResponse.json(
        { error: 'タイトル、画像URL、リンク先は必須です' },
        { status: 400 },
      );
    }

    const { data: updatedBanner, error } = await (supabase as any)
      .from('mst_banner')
      .update({
        title,
        image_url,
        href,
        sort_order: sort_order || 0,
        is_active: is_active !== false,
        updated_at: new Date().toISOString(),
      })
      .eq('banner_id', params.id)
      .select()
      .single();

    if (error) {
      console.error('バナー更新エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ banner: updatedBanner });
  } catch (error) {
    console.error('バナー更新エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'バナーの更新に失敗しました' },
      { status: 500 },
    );
  }
}

// バナー削除（論理削除）
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createAdminClient();

    const { error } = await (supabase as any)
      .from('mst_banner')
      .update({ deleted_at: new Date().toISOString() })
      .eq('banner_id', params.id);

    if (error) {
      console.error('バナー削除エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('バナー削除エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'バナーの削除に失敗しました' },
      { status: 500 },
    );
  }
}
