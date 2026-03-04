import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

// サーバーサイドでservice_roleを使ってユーザープロフィールを取得（RLSバイパス）
export const dynamic = 'force-dynamic';

export async function GET(
	request: NextRequest,
	{ params }: { params: { userId: string } }
) {
	try {
		const userId = params.userId;

		if (!userId) {
			return NextResponse.json(
				{ error: 'ユーザーIDが必要です' },
				{ status: 400 }
			);
		}

		const supabase = createAdminClient();

		const { data, error } = await supabase
			.from('mst_user')
			.select(`
				*,
				mst_industry (
					industry_name
				)
			`)
			.eq('user_id', userId)
			.is('deleted_at', null)
			.maybeSingle();

		if (error) {
			console.error('Error fetching user profile:', error);
			return NextResponse.json(
				{ error: 'プロフィールの取得に失敗しました' },
				{ status: 500 }
			);
		}

		if (!data) {
			return NextResponse.json(
				{ error: 'ユーザーが見つかりません' },
				{ status: 404 }
			);
		}

		// 業種名を取得
		const industryName = data.mst_industry && Array.isArray(data.mst_industry)
			? data.mst_industry[0]?.industry_name
			: (data.mst_industry as any)?.industry_name;

		const profile = {
			...data,
			industry_name: industryName || '',
			social_media_links: data.social_media_links || {},
			is_user_name_kana_visible: data.is_user_name_kana_visible ?? true,
			is_birth_date_visible: data.is_birth_date_visible ?? false,
			is_company_name_kana_visible: data.is_company_name_kana_visible ?? true,
		};

		return NextResponse.json(profile, {
			headers: {
				'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
				'Pragma': 'no-cache',
				'Expires': '0',
			},
		});
	} catch (error) {
		console.error('Server error:', error);
		return NextResponse.json(
			{ error: 'サーバーエラーが発生しました' },
			{ status: 500 }
		);
	}
}
