import { createClient } from '@/lib/supabase-server';

export const fetchRadios = async () => {
	const client = createClient();

	// 認証ユーザーの取得
	const {
		data: { user },
	} = await client.auth.getUser();

	if (!user) {
		return null;
	}

	// ユーザーの所属グループを取得
	const { data: userGroups } = await client
		.from('trn_group_user')
		.select('group_id')
		.eq('user_id', user.id)
		.is('deleted_at', null);

	const userGroupIds = userGroups?.map((g) => g.group_id) ?? [];

	const now = new Date().toISOString();

	// グループ制限があるラジオIDを取得
	const { data: allRadiosWithGroups } = await client
		.from('trn_radio_visible_group')
		.select('radio_id')
		.is('deleted_at', null);

	const radiosWithGroups = allRadiosWithGroups?.map((r) => r.radio_id) ?? [];

	// ユーザーが閲覧可能なラジオIDを取得
	let visibleRadioIds: string[] = [];
	if (userGroupIds.length > 0) {
		const { data: visibleRadios } = await client
			.from('trn_radio_visible_group')
			.select('radio_id')
			.in('group_id', userGroupIds)
			.is('deleted_at', null);

		visibleRadioIds = visibleRadios?.map((r) => r.radio_id) ?? [];
	}

	// ベースクエリを構築（下書き除外、公開期間チェック、削除除外）
	let radioQuery = client
		.from('mst_radio')
		.select(`
          id:radio_id,
          name:radio_name,
          imageUrl:image_url
      `)
		.is('deleted_at', null)
		.eq('is_draft', false)
		.lte('publish_start_at', now)
		.or(`publish_end_at.is.null,publish_end_at.gt.${now}`);

	// グループ制限フィルタリング
	if (radiosWithGroups.length > 0) {
		if (visibleRadioIds.length > 0) {
			// グループに紐づくラジオのうち、ユーザーが見れるもの、またはどのグループにも紐づいていないもの
			radioQuery = radioQuery.or(
				`radio_id.in.(${visibleRadioIds.join(',')}),radio_id.not.in.(${radiosWithGroups.join(',')})`,
			);
		} else {
			// ユーザーが見れるグループはないが、グループに紐づくラジオがある場合
			// どのグループにも紐づいていないラジオのみを表示
			radioQuery = radioQuery.not(
				'radio_id',
				'in',
				`(${radiosWithGroups.join(',')})`,
			);
		}
	}

	const { data } = await radioQuery
		.order('created_at', { ascending: false })
		.limit(5);
	return data;
};
