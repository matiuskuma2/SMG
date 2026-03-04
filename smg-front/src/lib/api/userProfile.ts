import type { MstUser } from '@/lib/supabase/types';

export interface UserProfile extends Omit<MstUser, 'social_media_links'> {
	industry_name?: string;
	social_media_links: Record<string, string>;
}

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
	try {
		// サーバーサイドAPI経由でプロフィールを取得（RLSバイパス）
		const response = await fetch(`/api/user-profile/${userId}`);
		
		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			throw new Error(`API error: ${response.status}`);
		}

		const data = await response.json();
		return data as UserProfile;
	} catch (error) {
		console.error('Error fetching user profile:', error);
		return null;
	}
}; 