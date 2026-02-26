import { createClient } from '@/lib/supabase';

type NFCExchangeUser = {
	id: string;
	username: string;
	company_name: string;
	industry_name: string;
	icon: string;
	exchange_date: string;
	created_at: string;
	is_username_visible: boolean;
	is_company_name_visible: boolean;
	is_industry_id_visible: boolean;
};

type ExchangeData = {
	user_id_1: string;
	user_id_2: string;
	event_id: string | null;
	created_at: string | null;
};

type Industry = {
	industry_name: string;
};

type UserData = {
	user_id: string;
	username: string | null;
	company_name: string | null;
	icon: string | null;
	industry_id: string | null;
	is_username_visible: boolean | null;
	is_company_name_visible: boolean | null;
	is_industry_id_visible: boolean | null;
	mst_industry: Industry | Industry[] | null;
};

export const fetchNFCExchangeHistory = async (userId: string) => {
	const supabase = createClient();

	// user_id_1がログイン中のユーザーの場合のみNFC交換履歴を取得
	const { data: exchangeData, error: exchangeError } = await supabase
		.from('trn_nfc_exchange')
		.select(`
			user_id_1,
			user_id_2,
			event_id,
			created_at
		`)
		.eq('user_id_1', userId)
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	if (exchangeError) throw exchangeError;

	if (!exchangeData || exchangeData.length === 0) {
		return { nfcExchangeUsers: [], industries: ['すべて'] };
	}

	// 交換相手のユーザー情報を取得
	const { data: userData, error: userError } = await supabase
		.from('mst_user')
		.select(`
			user_id,
			username,
			company_name,
			icon,
			industry_id,
			is_username_visible,
			is_company_name_visible,
			is_industry_id_visible,
			mst_industry (
				industry_name
			)
		`)
		.in(
			'user_id',
			exchangeData.map((exchange: ExchangeData) => exchange.user_id_2),
		)
		.is('deleted_at', null);

	if (userError) throw userError;

	// 結果を整形
	const formattedData: NFCExchangeUser[] = Object.values(
		exchangeData.reduce<{ [key: string]: ExchangeData }>(
			(acc, exchange: ExchangeData) => {
				const partnerId = exchange.user_id_2; // user_id_1は常にログインユーザーなので、交換相手はuser_id_2
				if (!exchange.created_at) return acc; // created_atがnullの場合はスキップ
				if (
					!acc[partnerId] ||
					new Date(exchange.created_at) > new Date(acc[partnerId].created_at!)
				) {
					acc[partnerId] = exchange;
				}
				return acc;
			},
			{},
		),
	)
		.map((exchange: ExchangeData) => {
			const partnerId = exchange.user_id_2; // 交換相手のIDはuser_id_2
			const userInfo = userData.find((u: UserData) => u.user_id === partnerId);

			if (!userInfo || !exchange.created_at) return null;

			const industryName = userInfo.mst_industry
				? Array.isArray(userInfo.mst_industry)
					? userInfo.mst_industry[0]?.industry_name
					: userInfo.mst_industry.industry_name
				: null;

			return {
				id: userInfo.user_id,
				username: userInfo.username || '名前なし',
				company_name: userInfo.company_name || '会社名なし',
				industry_name: industryName || '業種なし',
				icon: userInfo.icon || '/profile-icon.jpg',
				exchange_date:
					new Date(exchange.created_at)
						.toLocaleDateString('ja-JP', {
							year: 'numeric',
							month: '2-digit',
							day: '2-digit',
						})
						.replace(/\//g, '年')
						.replace(/\//g, '月') + '日',
				created_at: exchange.created_at,
				is_username_visible: userInfo.is_username_visible || false,
				is_company_name_visible: userInfo.is_company_name_visible || false,
				is_industry_id_visible: userInfo.is_industry_id_visible || false,
			};
		})
		.filter((item): item is NFCExchangeUser => item !== null);

	// 業種のリストを取得（重複を排除）
	const industryList = [
		'すべて',
		...Array.from(new Set(formattedData.map((user) => user.industry_name))),
	];

	return {
		nfcExchangeUsers: formattedData,
		industries: industryList,
	};
};
