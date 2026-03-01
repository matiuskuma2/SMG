import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// フロント用バナー一覧取得（公開・有効なバナーのみ）
export async function GET() {
  try {
    const supabase = createClient();

    const { data: banners, error } = await (supabase as any)
      .from('mst_banner')
      .select('banner_id, title, image_url, href, sort_order')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('バナー一覧取得エラー:', error);
      // エラー時はフォールバックデータを返す
      return NextResponse.json({
        banners: [
          { banner_id: 'fallback-1', title: '定例会 ゲスト講師一覧', image_url: '/top/banners/2_0.png', href: '/notice/23db5fa0-6554-4e37-a176-07ec34e41b64', sort_order: 1 },
          { banner_id: 'fallback-2', title: '初めての方', image_url: '/top/banners/3_0.png', href: '/beginner', sort_order: 2 },
          { banner_id: 'fallback-3', title: 'イベント', image_url: '/top/banners/4_0.png', href: '/events', sort_order: 3 },
          { banner_id: 'fallback-4', title: 'アーカイブ', image_url: '/top/banners/5_0.png', href: '/archive', sort_order: 4 },
        ],
      });
    }

    // データが空の場合もフォールバック
    if (!banners || banners.length === 0) {
      return NextResponse.json({
        banners: [
          { banner_id: 'fallback-1', title: '定例会 ゲスト講師一覧', image_url: '/top/banners/2_0.png', href: '/notice/23db5fa0-6554-4e37-a176-07ec34e41b64', sort_order: 1 },
          { banner_id: 'fallback-2', title: '初めての方', image_url: '/top/banners/3_0.png', href: '/beginner', sort_order: 2 },
          { banner_id: 'fallback-3', title: 'イベント', image_url: '/top/banners/4_0.png', href: '/events', sort_order: 3 },
          { banner_id: 'fallback-4', title: 'アーカイブ', image_url: '/top/banners/5_0.png', href: '/archive', sort_order: 4 },
        ],
      });
    }

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('バナー一覧取得エラー:', error);
    // エラー時はフォールバック
    return NextResponse.json({
      banners: [
        { banner_id: 'fallback-1', title: '定例会 ゲスト講師一覧', image_url: '/top/banners/2_0.png', href: '/notice/23db5fa0-6554-4e37-a176-07ec34e41b64', sort_order: 1 },
        { banner_id: 'fallback-2', title: '初めての方', image_url: '/top/banners/3_0.png', href: '/beginner', sort_order: 2 },
        { banner_id: 'fallback-3', title: 'イベント', image_url: '/top/banners/4_0.png', href: '/events', sort_order: 3 },
        { banner_id: 'fallback-4', title: 'アーカイブ', image_url: '/top/banners/5_0.png', href: '/archive', sort_order: 4 },
      ],
    });
  }
}
