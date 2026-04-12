import { getAuthenticatedClient } from '@/lib/auth-helper';
import { createAdminClient } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 配席結果取得API
 * GET /api/seating/assignments/[eventId]?roundNumber=1
 *
 * 機能:
 * - 指定されたイベントとラウンド番号の配席結果を取得
 * - テーブル番号ごとにグループ化して返却
 *
 * アクセス制御:
 * - Cookie経路: RLS が「運営/講師 または 当該イベント参加者」に制限
 * - Bearer経路: RLSバイパスされるため、コード側で同等チェックを明示実施
 *   (運営/講師 もしくは trn_seating_assignment に自分の user_id が存在する参加者)
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	try {
		// 認証 + Supabaseクライアント取得（Cookie or Bearer 両対応）
		const authResult = await getAuthenticatedClient();
		if (authResult.error !== undefined) {
			return NextResponse.json(
				{ error: authResult.error === '認証が必要です' ? 'Unauthorized' : authResult.error },
				{ status: authResult.status }
			);
		}
		const { client: supabase, userId, isBearer } = authResult;

		const resolvedParams = await params;
		const eventId = resolvedParams.eventId;

		// クエリパラメータからroundNumberを取得
		const { searchParams } = new URL(request.url);
		const roundNumber = searchParams.get('roundNumber') ? Number(searchParams.get('roundNumber')) : 1;

		if (!eventId) {
			return NextResponse.json(
				{ error: 'Event ID is required' },
				{ status: 400 }
			);
		}

		// Bearer経路: RLSが効かないためアクセス制御をコードで明示
		//  - 運営/講師 or 当該イベントの「正当な参加者」のみ許可
		//  - 正当な参加者の定義: 当該 event_id に対して
		//      trn_event_attendee / trn_gather_attendee / trn_consultation_attendee
		//    のいずれかに自分の user_id が登録されている (deleted_at IS NULL)
		//  - trn_seating_assignment 存在を要件にすると「配席生成前の参加者」が
		//    閲覧不可になるため、申込段階の所属で判定する
		if (isBearer) {
			const admin = createAdminClient();

			const { data: userGroups } = await admin
				.from('trn_group_user')
				.select('mst_group!inner(title)')
				.eq('user_id', userId)
				.is('deleted_at', null);
			const titles = (userGroups || []).map(
				(g: any) => g.mst_group?.title as string,
			);
			const isAdminOrInstructor =
				titles.includes('運営') || titles.includes('講師');

			let isEventParticipant = false;
			if (!isAdminOrInstructor) {
				// 3テーブルを並行チェック (deleted_at IS NULL)
				const [eventRes, gatherRes, consultRes] = await Promise.all([
					admin
						.from('trn_event_attendee')
						.select('user_id', { count: 'exact', head: true })
						.eq('event_id', eventId)
						.eq('user_id', userId)
						.is('deleted_at', null),
					admin
						.from('trn_gather_attendee')
						.select('user_id', { count: 'exact', head: true })
						.eq('event_id', eventId)
						.eq('user_id', userId)
						.is('deleted_at', null),
					admin
						.from('trn_consultation_attendee')
						.select('user_id', { count: 'exact', head: true })
						.eq('event_id', eventId)
						.eq('user_id', userId)
						.is('deleted_at', null),
				]);
				isEventParticipant =
					(eventRes.count || 0) > 0 ||
					(gatherRes.count || 0) > 0 ||
					(consultRes.count || 0) > 0;
			}

			if (!isAdminOrInstructor && !isEventParticipant) {
				return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
			}
		}

		// 配席データを取得
		const { data: assignments, error: assignmentsError } = await supabase
			.from('trn_seating_assignment')
			.select(`
				assignment_id,
				user_id,
				table_number,
				round_number,
				is_fixed,
				is_accessible_seat,
				created_at,
				mst_user!inner (
					user_id,
					username,
					nickname,
					icon,
					is_partner_tax_accountant,
					has_mobility_issues
				)
			`)
			.eq('event_id', eventId)
			.eq('round_number', roundNumber)
			.is('deleted_at', null)
			.order('table_number', { ascending: true });

		if (assignmentsError) {
			console.error('Error fetching assignments:', assignmentsError);
			return NextResponse.json(
				{ error: 'Failed to fetch seating assignments' },
				{ status: 500 }
			);
		}

		if (!assignments || assignments.length === 0) {
			return NextResponse.json(
				{ error: 'No seating assignments found' },
				{ status: 404 }
			);
		}

		// テーブルごとにグループ化
		const tableMap: Record<number, any[]> = {};
		for (const assignment of assignments as any[]) {
			const tableNumber = assignment.table_number;
			if (!tableMap[tableNumber]) {
				tableMap[tableNumber] = [];
			}
			tableMap[tableNumber].push({
				assignment_id: assignment.assignment_id,
				user_id: assignment.user_id,
				username: assignment.mst_user?.username || '',
				nickname: assignment.mst_user?.nickname || '',
				icon: assignment.mst_user?.icon || null,
				is_fixed: assignment.is_fixed,
				is_accessible_seat: assignment.is_accessible_seat,
				is_partner_tax_accountant: assignment.mst_user?.is_partner_tax_accountant || false,
				has_mobility_issues: assignment.mst_user?.has_mobility_issues || false,
			});
		}

		// テーブル配列に変換
		const tables = Object.keys(tableMap)
			.map((tableNum) => ({
				table_number: Number(tableNum),
				participants: tableMap[Number(tableNum)],
			}))
			.sort((a, b) => a.table_number - b.table_number);

		return NextResponse.json({
			success: true,
			data: {
				eventId,
				roundNumber,
				totalTables: tables.length,
				totalParticipants: assignments.length,
				tables,
			},
		});
	} catch (error) {
		console.error('Unexpected error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
