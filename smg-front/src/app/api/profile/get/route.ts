import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	try {
		const supabase = createClient();

		// 認証されたユーザーを取得
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json(
				{ error: '認証が必要です' },
				{ status: 401 }
			);
		}

		// ユーザーのプロフィール情報を取得
		const { data: profile, error: profileError } = await supabase
			.from('mst_user')
			.select(`
				user_id,
				username,
				nickname,
				user_name_kana,
				email,
				phone_number,
				user_position,
				birth_date,
				company_name,
				company_name_kana,
				company_address,
				industry_id,
				bio,
				website_url,
				social_media_links,
				icon,
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
				is_profile_public
			`)
			.eq('user_id', user.id)
			.single();

		if (profileError) {
			console.error('プロフィール取得エラー:', profileError);
			return NextResponse.json(
				{ error: 'プロフィール情報の取得に失敗しました' },
				{ status: 500 }
			);
		}

		// 業界情報を取得
		let industryName = null;
		if (profile.industry_id) {
			const { data: industry } = await supabase
				.from('mst_industry')
				.select('industry_name')
				.eq('industry_id', profile.industry_id)
				.single();
			
			industryName = industry?.industry_name || null;
		}

		// レスポンス用のデータを整形
		const responseData = {
			name: profile.username || '',
			nameKana: profile.user_name_kana || '',
			nickname: profile.nickname || '',
			email: profile.email || '',
			phoneNumber: profile.phone_number || '',
			userPosition: profile.user_position || '',
			birthday: profile.birth_date || '',
			companyName: profile.company_name || '',
			companyNameKana: profile.company_name_kana || '',
			companyAddress: profile.company_address || '',
			industry: industryName || '',
			industryId: profile.industry_id || '',
			customIndustry: '', // カスタム業界は別途処理が必要
			introduction: profile.bio || '',
			website: profile.website_url || '',
			sns: {
				instagram: '',
				facebook: '',
				tiktok: '',
				x: '',
				youtube: '',
				other: '',
				...(profile.social_media_links as Record<string, string> || {}),
			},
			profileImage: profile.icon || '/profile-icon.jpg',
			visibility: {
				name: profile.is_username_visible ?? true,
				nameKana: profile.is_user_name_kana_visible ?? true,
				nickname: profile.is_nickname_visible ?? true,
				email: profile.is_email_visible ?? false,
				phoneNumber: profile.is_phone_number_visible ?? false,
				userPosition: profile.is_user_position_visible ?? true,
				birthday: profile.is_birth_date_visible ?? false,
				companyName: profile.is_company_name_visible ?? true,
				companyNameKana: profile.is_company_name_kana_visible ?? true,
				companyAddress: profile.is_company_address_visible ?? true,
				industry: profile.is_industry_id_visible ?? true,
				introduction: profile.is_bio_visible ?? true,
				website: profile.is_website_url_visible ?? true,
				sns: profile.is_sns_visible ?? true,
			},
		};

		return NextResponse.json(responseData);
	} catch (error) {
		console.error('API エラー:', error);
		return NextResponse.json(
			{ error: 'サーバーエラーが発生しました' },
			{ status: 500 }
		);
	}
} 