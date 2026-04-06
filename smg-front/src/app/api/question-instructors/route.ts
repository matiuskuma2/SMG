import { createAdminClient } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 質問ページ用の講師一覧取得API
 *
 * RLS により一般塾生は is_profile_public=false の講師プロフィールを
 * 取得できないため、サーバーサイドで createAdminClient を使用して
 * RLS をバイパスする。
 *
 * 返却: { id: string; username: string | null }[]
 */
export async function GET() {
	try {
		const supabase = createAdminClient();

		// 講師_質問受付グループのIDを取得
		const { data: groupData, error: groupError } = await supabase
			.from('mst_group')
			.select('group_id')
			.eq('title', '講師_質問受付グループ')
			.is('deleted_at', null)
			.single();

		if (groupError || !groupData) {
			console.error('講師グループの取得に失敗しました:', groupError);
			return NextResponse.json(
				{ error: '講師グループの取得に失敗しました' },
				{ status: 500 },
			);
		}

		// 講師ユーザーの情報を取得
		const { data: instructorsData, error: instructorsError } = await supabase
			.from('trn_group_user')
			.select(`
				user_id,
				mst_user!inner (
					user_id,
					username
				)
			`)
			.eq('group_id', groupData.group_id)
			.is('deleted_at', null)
			.is('mst_user.deleted_at', null);

		if (instructorsError) {
			console.error('講師データの取得に失敗しました:', instructorsError);
			return NextResponse.json(
				{ error: '講師データの取得に失敗しました' },
				{ status: 500 },
			);
		}

		// QuestionForm の Instructor 型に合わせて整形
		const instructors = (instructorsData || []).map((item) => ({
			id: (item.mst_user as { user_id: string; username: string | null }).user_id,
			username: (item.mst_user as { user_id: string; username: string | null }).username,
		}));

		return NextResponse.json(instructors);
	} catch (error) {
		console.error('講師一覧取得エラー:', error);
		return NextResponse.json(
			{ error: 'サーバーエラーが発生しました' },
			{ status: 500 },
		);
	}
}
