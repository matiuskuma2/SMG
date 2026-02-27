import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * ユーザー向けタブ一覧取得 API
 * - status が 'public' のタブのみ
 * - ユーザーのグループに基づいてフィルタリング
 * - 運営・講師グループは全タブ閲覧可能
 */
export async function GET() {
	try {
		const supabase = createClient();

		// 認証ユーザー取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json(
				{ error: '認証が必要です' },
				{ status: 401 },
			);
		}

		// 公開中のタブを取得
		const { data: tabs, error: tabError } = await supabase
			.from('mst_tab')
			.select(`
				tab_id,
				display_name,
				link_type,
				link_value,
				display_order,
				is_visible_to_all
			`)
			.eq('status', 'public')
			.is('deleted_at', null)
			.order('display_order', { ascending: true });

		if (tabError) {
			console.error('タブ取得エラー:', tabError);
			return NextResponse.json(
				{ error: 'タブの取得に失敗しました' },
				{ status: 500 },
			);
		}

		// ユーザーが所属するグループを取得
		const { data: userGroups, error: groupError } = await supabase
			.from('trn_group_user')
			.select(`
				group_id,
				mst_group!inner(title)
			`)
			.eq('user_id', user.id)
			.is('deleted_at', null);

		if (groupError) {
			console.error('グループ取得エラー:', groupError);
		}

		const userGroupIds = (userGroups || []).map((g: any) => g.group_id);
		const userGroupTitles = (userGroups || []).map(
			(g: any) => g.mst_group.title as string,
		);

		// 運営 or 講師 に所属していれば全タブ閲覧可能
		const hasFullAccess =
			userGroupTitles.includes('運営') || userGroupTitles.includes('講師');

		if (hasFullAccess) {
			// 全タブを返す
			return NextResponse.json({
				tabs: (tabs || []).map((tab) => ({
					tab_id: tab.tab_id,
					label: tab.display_name,
					href: tab.link_value,
					link_type: tab.link_type,
				})),
			});
		}

		// グループ制限付きタブのフィルタリング
		const filteredTabs = [];

		for (const tab of tabs || []) {
			if (tab.is_visible_to_all) {
				filteredTabs.push(tab);
				continue;
			}

			// タブの表示グループを取得
			const { data: visibleGroups } = await supabase
				.from('trn_tab_visible_group')
				.select('group_id')
				.eq('tab_id', tab.tab_id)
				.is('deleted_at', null);

			const visibleGroupIds = (visibleGroups || []).map(
				(vg: any) => vg.group_id,
			);

			// ユーザーのグループと一致するか確認
			const hasAccess = userGroupIds.some((gid: string) =>
				visibleGroupIds.includes(gid),
			);

			if (hasAccess) {
				filteredTabs.push(tab);
			}
		}

		return NextResponse.json({
			tabs: filteredTabs.map((tab) => ({
				tab_id: tab.tab_id,
				label: tab.display_name,
				href: tab.link_value,
				link_type: tab.link_type,
			})),
		});
	} catch (error) {
		console.error('タブAPI エラー:', error);
		return NextResponse.json(
			{ error: 'サーバーエラーが発生しました' },
			{ status: 500 },
		);
	}
}
