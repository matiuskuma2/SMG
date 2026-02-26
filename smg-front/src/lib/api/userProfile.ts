import { createClient } from '@/lib/supabase';
import type { MstUser } from '@/lib/supabase/types';

export interface UserProfile extends Omit<MstUser, 'social_media_links'> {
	industry_name?: string;
	social_media_links: Record<string, string>;
}

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
	const supabase = createClient();
	
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
		return null;
	}

	if (!data) {
		return null;
	}

	// 業種名を取得
	const industryName = data.mst_industry && Array.isArray(data.mst_industry) 
		? data.mst_industry[0]?.industry_name 
		: (data.mst_industry as any)?.industry_name;

	return {
		...data,
		industry_name: industryName || '',
		social_media_links: data.social_media_links || {},
		// 新しいフラグのデフォルト値を設定
		is_user_name_kana_visible: data.is_user_name_kana_visible ?? true,
		is_birth_date_visible: data.is_birth_date_visible ?? false,
		is_company_name_kana_visible: data.is_company_name_kana_visible ?? true
	} as unknown as UserProfile;
}; 