import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 配席結果取得API
 * GET /api/seating/assignments/[eventId]?roundNumber=1
 * 
 * 機能:
 * - 指定されたイベントとラウンド番号の配席結果を取得
 * - テーブル番号ごとにグループ化して返却
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	try {
		const supabase = await createClient();

		// 認証チェック
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			);
		}

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
		for (const assignment of assignments) {
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
