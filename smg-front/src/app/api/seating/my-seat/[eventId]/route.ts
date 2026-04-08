import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 自分の席番号取得API
 * GET /api/seating/my-seat/[eventId]
 * 
 * 機能:
 * - ログインユーザーの席番号を取得（前半・後半両方）
 * - 配席がない場合は404を返す
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

		if (!eventId) {
			return NextResponse.json(
				{ error: 'Event ID is required' },
				{ status: 400 }
			);
		}

		// 自分の配席データを取得（前半・後半両方）
		const { data: assignments, error: assignmentsError } = await supabase
			.from('trn_seating_assignment')
			.select(`
				assignment_id,
				table_number,
				round_number,
				is_fixed,
				is_accessible_seat,
				created_at
			`)
			.eq('event_id', eventId)
			.eq('user_id', user.id)
			.is('deleted_at', null)
			.order('round_number', { ascending: true });

		if (assignmentsError) {
			console.error('Error fetching my seat:', assignmentsError);
			return NextResponse.json(
				{ error: 'Failed to fetch seat information' },
				{ status: 500 }
			);
		}

		if (!assignments || assignments.length === 0) {
			return NextResponse.json(
				{ error: 'No seat assignment found' },
				{ status: 404 }
			);
		}

		// ラウンドごとに整理
		const round1 = assignments.find((a) => a.round_number === 1);
		const round2 = assignments.find((a) => a.round_number === 2);

		return NextResponse.json({
			success: true,
			data: {
				eventId,
				userId: user.id,
				round1: round1
					? {
							table_number: round1.table_number,
							is_fixed: round1.is_fixed,
							is_accessible_seat: round1.is_accessible_seat,
							created_at: round1.created_at,
					  }
					: null,
				round2: round2
					? {
							table_number: round2.table_number,
							is_fixed: round2.is_fixed,
							is_accessible_seat: round2.is_accessible_seat,
							created_at: round2.created_at,
					  }
					: null,
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
