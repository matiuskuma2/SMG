import { NextRequest, NextResponse } from 'next/server';

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

		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
		const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

		// Direct REST API call to bypass any client-side issues
		const restUrl = `${supabaseUrl}/rest/v1/mst_user?user_id=eq.${userId}&deleted_at=is.null&select=*,mst_industry(industry_name)`;
		
		const restResponse = await fetch(restUrl, {
			headers: {
				'apikey': serviceRoleKey,
				'Authorization': `Bearer ${serviceRoleKey}`,
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				'Prefer': 'return=representation',
			},
			cache: 'no-store',
		});

		if (!restResponse.ok) {
			const errorText = await restResponse.text();
			console.error('REST API error:', errorText);
			return NextResponse.json(
				{ error: 'プロフィールの取得に失敗しました' },
				{ status: 500 }
			);
		}

		const results = await restResponse.json();
		const data = results[0] || null;

		if (!data) {
			return NextResponse.json(
				{ error: 'ユーザーが見つかりません' },
				{ status: 404 }
			);
		}

		// 業種名を取得
		const industryName = data.mst_industry && Array.isArray(data.mst_industry)
			? data.mst_industry[0]?.industry_name
			: data.mst_industry?.industry_name;

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
