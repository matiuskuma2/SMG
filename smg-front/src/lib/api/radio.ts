import type { Radio } from '@/components/radio/types';
import { createClient } from '@/lib/supabase';

/**
 * ラジオ一覧を取得する
 * @param year 年でフィルター（例: '2024'）
 * @param sortOrder ソート順（newest: 新しい順, oldest: 古い順）
 * @param page ページ番号（1から開始）
 * @param pageSize 1ページあたりのアイテム数
 * @returns ラジオデータと総件数
 */
export async function getRadios(
	year?: string,
	sortOrder: 'newest' | 'oldest' = 'newest',
	page = 1,
	pageSize = 10,
): Promise<{ items: Radio[]; totalCount: number }> {
	try {
		const supabase = createClient();

		// 認証ユーザーの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return { items: [], totalCount: 0 };
		}

		// ユーザーの所属グループを取得
		const { data: userGroups } = await supabase
			.from('trn_group_user')
			.select('group_id')
			.eq('user_id', user.id)
			.is('deleted_at', null);

		const userGroupIds = userGroups?.map((g) => g.group_id) || [];

		// ベースクエリの構築
		let query = supabase
			.from('mst_radio')
			.select('*', { count: 'exact' })
			.is('deleted_at', null)
			.eq('is_draft', false)
			.lte('publish_start_at', new Date().toISOString());

		// publish_end_atのチェック（NULLまたは未来の日付）
		query = query.or(
			`publish_end_at.is.null,publish_end_at.gt.${new Date().toISOString()}`,
		);

		// グループ制限があるラジオIDを取得
		const { data: allRadiosWithGroups } = await supabase
			.from('trn_radio_visible_group')
			.select('radio_id')
			.is('deleted_at', null);

		const radiosWithGroups =
			allRadiosWithGroups?.map((r) => r.radio_id) || [];

		// グループによる可視性フィルタリング
		if (radiosWithGroups.length > 0) {
			if (userGroupIds.length > 0) {
				const { data: visibleRadios } = await supabase
					.from('trn_radio_visible_group')
					.select('radio_id')
					.in('group_id', userGroupIds)
					.is('deleted_at', null);

				const visibleRadioIds = visibleRadios?.map((r) => r.radio_id) || [];

				if (visibleRadioIds.length > 0) {
					// グループに紐づくラジオのうち、ユーザーが見れるもの、またはどのグループにも紐づいていないもの
					query = query.or(
						`radio_id.in.(${visibleRadioIds.join(',')}),radio_id.not.in.(${radiosWithGroups.join(',')})`,
					);
				} else {
					// ユーザーが見れるグループはないが、グループに紐づくラジオがある場合
					// どのグループにも紐づいていないラジオのみを表示
					query = query.not('radio_id', 'in', `(${radiosWithGroups.join(',')})`);
				}
			} else {
				// ユーザーがどのグループにも所属していない場合
				// どのグループにも紐づいていないラジオのみを表示
				query = query.not('radio_id', 'in', `(${radiosWithGroups.join(',')})`);
			}
		}

		// ソート（publish_start_atまたはcreated_atで降順/昇順）
		const ascending = sortOrder === 'oldest';
		query = query.order('publish_start_at', {
			ascending,
			nullsFirst: false,
		});
		query = query.order('created_at', { ascending, nullsFirst: false });

		// データ取得（全件）
		const { data: allData, error: fetchError } = await query;

		if (fetchError) {
			console.error('Error fetching radios:', fetchError);
			throw fetchError;
		}

		// 年フィルタリング（publish_start_at または created_at ベース）
		let filteredData = allData || [];
		if (year) {
			filteredData = filteredData.filter((radio) => {
				const targetDate = radio.publish_start_at || radio.created_at;
				if (!targetDate) return false;
				const radioYear = new Date(targetDate).getFullYear().toString();
				return radioYear === year;
			});
		}

		// ページネーション適用（年フィルタリング後）
		const totalCount = filteredData.length;
		const start = (page - 1) * pageSize;
		const end = start + pageSize;
		const paginatedData = filteredData.slice(start, end);

		return {
			items: paginatedData as Radio[],
			totalCount,
		};
	} catch (error) {
		console.error('Error in getRadios:', error);
		return { items: [], totalCount: 0 };
	}
}
