import type { NoticeFile } from '@/components/notice/types';
import { createClient } from '@/lib/supabase';

/**
 * お知らせ情報の型定義（Supabaseの型を拡張）
 */
export type NoticeListItem = {
	id: number;
	noticeId: string; // UUID形式の元のID
	date: string;
	title: string;
	details: string;
	category?: {
		id: string;
		name: string;
		description?: string;
	};
};

/**
 * 日付を日本時間でフォーマットする
 */
function formatDate(dateString: string): string {
	// UTCの日付文字列を日本時間に変換（+9時間）
	const date = new Date(dateString);

	// 日本時間の日付と時刻を取得
	const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
	const year = jstDate.getUTCFullYear();
	const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
	const day = String(jstDate.getUTCDate()).padStart(2, '0');

	return `${year}.${month}.${day}`;
}

/**
 * 現在のUTC時間を取得する
 */
function getCurrentUTC(): string {
	return new Date().toISOString();
}

/**
 * ログインユーザーが所属するグループIDを取得する
 */
async function getUserGroupIds(): Promise<string[]> {
	const supabase = createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	const userId = user?.id;

	if (!userId) {
		return [];
	}

	const { data: userGroups, error: userGroupError } = await supabase
		.from('trn_group_user')
		.select('group_id')
		.eq('user_id', userId)
		.is('deleted_at', null);

	if (userGroupError) {
		console.error('Error fetching user groups:', userGroupError);
		return [];
	}

	return userGroups.map((ug) => ug.group_id);
}

/**
 * お知らせ一覧を取得する
 * @param categoryType - カテゴリの種類で絞り込み ('notice' | 'shibu' | 'master')。省略時はお知らせ（notice + カテゴリなし）
 */
export async function getNotices(
	searchTerm?: string,
	sortOption: 'date_desc' | 'date_asc' = 'date_desc',
	categoryId?: string,
	page?: number,
	pageSize?: number,
	categoryType?: 'notice' | 'shibu' | 'master',
): Promise<{ notices: NoticeListItem[]; totalCount: number }> {
	const supabase = createClient();
	const nowUTC = getCurrentUTC();

	// ユーザーが所属するグループのIDを取得
	const userGroupIds = await getUserGroupIds();

	// グループ制限の情報を並行取得
	const [restrictedNoticesResult, visibleNoticesResult] = await Promise.all([
		// すべての制限対象お知らせID
		supabase
			.from('trn_notice_visible_group')
			.select('notice_id')
			.is('deleted_at', null),
		// ユーザーが閲覧可能なお知らせID
		userGroupIds.length > 0
			? supabase
					.from('trn_notice_visible_group')
					.select('notice_id')
					.in('group_id', userGroupIds)
					.is('deleted_at', null)
			: Promise.resolve({ data: null }),
	]);

	const restrictedNoticeIds = new Set(
		restrictedNoticesResult.data?.map((rn) => rn.notice_id) || [],
	);
	const visibleNoticeIds = new Set(
		visibleNoticesResult.data?.map((vn) => vn.notice_id) || [],
	);

	let baseQuery = supabase
		.from('mst_notice')
		.select(
			`
      notice_id,
      title,
      content,
      category_id,
      publish_start_at,
      publish_end_at,
      created_at,
      updated_at
    `,
			{ count: 'exact' },
		)
		.is('deleted_at', null)
		.eq('is_draft', false)
		.lte('publish_start_at', nowUTC)
		.or(`publish_end_at.is.null,publish_end_at.gt.${nowUTC}`);

	// カテゴリーIDによるフィルター
	if (categoryId) {
		baseQuery = baseQuery.eq('category_id', categoryId);
	}

	// カテゴリタイプによるフィルター（支部/マスター講座/お知らせ）
	if (categoryType) {
		// カテゴリタイプに対応するカテゴリIDを取得
		const { data: typedCategories } = await supabase
			.from('mst_notice_category')
			.select('category_id')
			.eq('description', categoryType)
			.is('deleted_at', null);

		const typedCategoryIds = (typedCategories || []).map((c) => c.category_id);

		if (typedCategoryIds.length > 0) {
			baseQuery = baseQuery.in('category_id', typedCategoryIds);
		} else {
			// カテゴリが見つからない場合は空を返す
			return { notices: [], totalCount: 0 };
		}
	}

	// 検索条件があれば適用
	if (searchTerm) {
		baseQuery = baseQuery.ilike('title', `%${searchTerm}%`);
	}

	// グループフィルタリング
	// 制限なし、または閲覧可能なもののみ
	const excludeNoticeIds = Array.from(restrictedNoticeIds).filter(
		(id) => !visibleNoticeIds.has(id),
	);

	if (excludeNoticeIds.length > 0) {
		baseQuery = baseQuery.not(
			'notice_id',
			'in',
			`(${excludeNoticeIds.join(',')})`,
		);
	}

	// ソート条件の適用
	let query = baseQuery.order('publish_start_at', {
		ascending: sortOption === 'date_asc',
	});

	// ページネーションを適用（Supabaseの.range()を使用）
	if (page !== undefined && pageSize !== undefined) {
		const startIndex = (page - 1) * pageSize;
		const endIndex = startIndex + pageSize - 1;
		query = query.range(startIndex, endIndex);
	}

	const { data, error, count } = await query;

	if (error) {
		console.error('お知らせの取得に失敗しました:', error);
		return { notices: [], totalCount: 0 };
	}

	if (!data || data.length === 0) {
		return { notices: [], totalCount: count || 0 };
	}

	const paginatedData = data;
	const totalCount = count || 0;

	// カテゴリー情報を別途取得
	const categoryIds = [
		...new Set(
			paginatedData
				.filter((item) => item.category_id !== null)
				.map((item) => item.category_id as string),
		),
	];
	let categoriesMap: Record<string, any> = {};

	if (categoryIds.length > 0) {
		try {
			const { data: categories, error: categoryError } = await supabase
				.from('mst_notice_category')
				.select('category_id, category_name, description')
				.in('category_id', categoryIds)
				.is('deleted_at', null);

			if (!categoryError && categories) {
				categoriesMap = categories.reduce(
					(acc, cat) => {
						acc[cat.category_id] = cat;
						return acc;
					},
					{} as Record<string, any>,
				);
			}
		} catch (categoryError) {
			console.warn('カテゴリー情報の取得に失敗しました:', categoryError);
		}
	}

	// APIの形式に変換
	const notices = paginatedData.map((item: any) => ({
		id: Number.parseInt(item.notice_id, 16) % 1000000,
		noticeId: item.notice_id, // UUID形式の元のIDを保持
		date: item.publish_start_at ? formatDate(item.publish_start_at) : '未設定',
		title: item.title,
		details: item.content,
		category:
			item.category_id && categoriesMap[item.category_id]
				? {
						id: categoriesMap[item.category_id].category_id,
						name: categoriesMap[item.category_id].category_name,
						description:
							categoriesMap[item.category_id].description || undefined,
					}
				: undefined,
	}));

	return { notices, totalCount };
}

/**
 * noticeIntId（数値ID）からお知らせ情報を取得する
 * 全件検索からのリンク用
 */
export async function getNoticeByIntId(
	noticeIntId: number,
): Promise<{ title: string; noticeId: string } | null> {
	const supabase = createClient();
	const nowUTC = getCurrentUTC();

	// 公開中のお知らせを全件取得してnoticeIntIdと一致するものを探す
	const { data, error } = await supabase
		.from('mst_notice')
		.select('notice_id, title')
		.is('deleted_at', null)
		.eq('is_draft', false)
		.lte('publish_start_at', nowUTC)
		.or(`publish_end_at.is.null,publish_end_at.gt.${nowUTC}`);

	if (error || !data) {
		console.error('お知らせの取得に失敗しました:', error);
		return null;
	}

	// noticeIntIdと一致するお知らせを検索
	const targetNotice = data.find((notice) => {
		const intId = Number.parseInt(notice.notice_id, 16) % 1000000;
		return intId === noticeIntId;
	});

	if (!targetNotice) {
		return null;
	}

	return {
		title: targetNotice.title,
		noticeId: targetNotice.notice_id,
	};
}

/**
 * UUIDでお知らせ単体を取得する（単体表示ページ用）
 */
export async function getNoticeByUUID(
	noticeUUID: string,
): Promise<{
	notice_id: string;
	title: string;
	content: string;
	publish_start_at: string | null;
	created_at: string | null;
	category?: {
		id: string;
		name: string;
		description?: string;
	};
} | null> {
	const supabase = createClient();

	const { data, error } = await supabase
		.from('mst_notice')
		.select(
			`
			notice_id,
			title,
			content,
			publish_start_at,
			created_at,
			category_id
		`,
		)
		.eq('notice_id', noticeUUID)
		.is('deleted_at', null)
		.eq('is_draft', false)
		.single();

	if (error || !data) {
		console.error('お知らせの取得に失敗しました:', error);
		return null;
	}

	// カテゴリー情報を取得
	let category: { id: string; name: string; description?: string } | undefined;
	if (data.category_id) {
		const { data: catData } = await supabase
			.from('mst_notice_category')
			.select('category_id, category_name, description')
			.eq('category_id', data.category_id)
			.is('deleted_at', null)
			.single();

		if (catData) {
			category = {
				id: catData.category_id,
				name: catData.category_name,
				description: catData.description || undefined,
			};
		}
	}

	return {
		notice_id: data.notice_id,
		title: data.title,
		content: data.content,
		publish_start_at: data.publish_start_at,
		created_at: data.created_at,
		category,
	};
}

/**
 * お知らせIDに紐づくファイル一覧を取得する
 */
export async function getNoticeFiles(noticeId: string): Promise<NoticeFile[]> {
	const supabase = createClient();

	const { data, error } = await supabase
		.from('trn_notice_file')
		.select('*')
		.eq('notice_id', noticeId)
		.is('deleted_at', null)
		.order('display_order', { ascending: true });

	if (error) {
		console.error('お知らせファイルの取得に失敗しました:', error);
		return [];
	}

	return data || [];
}
