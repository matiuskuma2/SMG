import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

// サーバーサイドでservice_roleを使ってユーザープロフィールを取得（RLSバイパス）
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ userId: string }> }
) {
	try {
		const { userId } = await params;

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
				user_id,
				user_position,
				company_name,
				company_name_kana,
				company_address,
				industry_id,
				email,
				username,
				user_name_kana,
				phone_number,
				icon,
				bio,
				website_url,
				social_media_links,
				is_profile_public,
				nickname,
				is_username_visible,
				is_nickname_visible,
				is_company_name_visible,
				is_company_address_visible,
				is_industry_id_visible,
				is_bio_visible,
				is_website_url_visible,
				is_sns_visible,
				is_user_position_visible,
				is_email_visible,
				is_phone_number_visible,
				is_user_name_kana_visible,
				is_birth_date_visible,
				is_company_name_kana_visible,
				birth_date,
				created_at,
				updated_at,
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

		return NextResponse.json(profile);
	} catch (error) {
		console.error('Server error:', error);
		return NextResponse.json(
			{ error: 'サーバーエラーが発生しました' },
			{ status: 500 }
		);
	}
}
