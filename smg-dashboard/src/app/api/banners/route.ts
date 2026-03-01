import { createAdminClient } from '@/lib/supabase/admin';
import { type NextRequest, NextResponse } from 'next/server';

// バナー一覧取得
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: banners, error } = await (supabase as any)
      .from('mst_banner')
      .select('*')
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('バナー一覧取得エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ banners: banners || [] });
  } catch (error) {
    console.error('バナー一覧取得エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'バナー一覧の取得に失敗しました' },
      { status: 500 },
    );
  }
}

// バナー作成
export async function POST(request: NextRequest) {
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

    // バナー作成
    const { data: newBanner, error: insertError } = await (supabase as any)
      .from('mst_banner')
      .insert({
        title,
        image_url,
        href,
        sort_order: sort_order || 0,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('バナー作成エラー:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ banner: newBanner }, { status: 201 });
  } catch (error) {
    console.error('バナー作成エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'バナーの作成に失敗しました' },
      { status: 500 },
    );
  }
}
