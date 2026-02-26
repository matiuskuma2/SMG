'use client';

import type { MstUser } from '@/lib/supabase/types';
import type React from 'react';
import {
	type ReactNode,
	createContext,
	useContext,
	useEffect,
	useState,
} from 'react';

interface ProfileData {
	name: NonNullable<MstUser['username']>;
	nameKana: NonNullable<MstUser['user_name_kana']>;
	nickname: NonNullable<MstUser['nickname']>;
	email: MstUser['email'];
	phoneNumber: NonNullable<MstUser['phone_number']>;
	userPosition: NonNullable<MstUser['user_position']>;
	companyName: NonNullable<MstUser['company_name']>;
	companyNameKana: NonNullable<MstUser['company_name_kana']>;
	companyAddress: NonNullable<MstUser['company_address']>;
	industry: string;
	industryId: NonNullable<MstUser['industry_id']>;
	customIndustry: string;
	introduction: NonNullable<MstUser['bio']>;
	website: NonNullable<MstUser['website_url']>;
	sns: Record<string, string>;
	birthday: NonNullable<MstUser['birth_date']>;
	profileImage: NonNullable<MstUser['icon']>;
}

interface ProfileVisibility {
	name: NonNullable<MstUser['is_username_visible']>;
	nameKana: NonNullable<MstUser['is_user_name_kana_visible']>;
	nickname: NonNullable<MstUser['is_nickname_visible']>;
	email: NonNullable<MstUser['is_email_visible']>;
	phoneNumber: NonNullable<MstUser['is_phone_number_visible']>;
	userPosition: NonNullable<MstUser['is_user_position_visible']>;
	companyName: NonNullable<MstUser['is_company_name_visible']>;
	companyNameKana: NonNullable<MstUser['is_company_name_kana_visible']>;
	companyAddress: NonNullable<MstUser['is_company_address_visible']>;
	industry: NonNullable<MstUser['is_industry_id_visible']>;
	introduction: NonNullable<MstUser['is_bio_visible']>;
	website: NonNullable<MstUser['is_website_url_visible']>;
	sns: NonNullable<MstUser['is_sns_visible']>;
	birthday: NonNullable<MstUser['is_birth_date_visible']>;
}

interface UpdateProfileResult {
	success: boolean;
	error?: string;
	field?: string;
}

interface ProfileContextType {
	profileData: ProfileData;
	visibility: ProfileVisibility;
	loading: boolean;
	updateProfile: (
		data: ProfileData,
		visibility: ProfileVisibility,
	) => Promise<UpdateProfileResult>;
	loadProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [profileData, setProfileData] = useState<ProfileData>({
		name: '',
		nameKana: '',
		nickname: '',
		email: '',
		phoneNumber: '',
		userPosition: '',
		companyName: '',
		companyNameKana: '',
		companyAddress: '',
		industry: '',
		industryId: '',
		customIndustry: '',
		introduction: '',
		website: '',
		sns: {},
		birthday: '',
		profileImage: '/profile-icon.jpg',
	});
	const [visibility, setVisibility] = useState<ProfileVisibility>({
		name: true,
		nameKana: true,
		nickname: true,
		email: false,
		phoneNumber: false,
		userPosition: true,
		companyName: true,
		companyNameKana: true,
		companyAddress: true,
		industry: true,
		introduction: true,
		website: true,
		sns: true,
		birthday: false,
	});
	const [loading, setLoading] = useState<boolean>(true);

	const loadProfile = async (): Promise<void> => {
		try {
			setLoading(true);
			const response = await fetch('/api/profile/get');

			if (response.ok) {
				const data = await response.json();
				setProfileData(data);
				setVisibility(data.visibility);
			} else {
				console.error('プロフィール取得に失敗しました');
			}
		} catch (error) {
			console.error('プロフィール取得エラー:', error);
		} finally {
			setLoading(false);
		}
	};

	const updateProfile = async (
		data: ProfileData,
		visibility: ProfileVisibility,
	): Promise<UpdateProfileResult> => {
		try {
			const response = await fetch('/api/profile/update', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: data.name,
					nameKana: data.nameKana,
					nickname: data.nickname,
					email: data.email,
					phoneNumber: data.phoneNumber,
					userPosition: data.userPosition,
					birthday: data.birthday,
					companyName: data.companyName,
					companyNameKana: data.companyNameKana,
					companyAddress: data.companyAddress,
					industryId: data.industryId,
					customIndustry: data.customIndustry,
					introduction: data.introduction,
					website: data.website,
					sns: data.sns,
					visibility: visibility,
				}),
			});

			if (response.ok) {
				setProfileData(data);
				setVisibility(visibility);
				return { success: true };
			} else {
				const errorData = await response.json();
				console.error('プロフィール更新エラー:', errorData.error);
				return {
					success: false,
					error: errorData.error || 'プロフィールの保存に失敗しました',
					field: errorData.field,
				};
			}
		} catch (error) {
			console.error('プロフィール更新エラー:', error);
			return {
				success: false,
				error: '通信エラーが発生しました。しばらく経ってからお試しください。',
			};
		}
	};

	// 初回ロード時にプロフィールを取得
	useEffect(() => {
		loadProfile();
	}, []);

	return (
		<ProfileContext.Provider
			value={{ profileData, visibility, loading, updateProfile, loadProfile }}
		>
			{children}
		</ProfileContext.Provider>
	);
};

export const useProfile = () => {
	const context = useContext(ProfileContext);
	if (context === undefined) {
		throw new Error('useProfile must be used within a ProfileProvider');
	}
	return context;
};

export type { ProfileData, ProfileVisibility };
