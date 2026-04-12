import { getAuthenticatedClient } from '@/lib/auth-helper';
import { createAdminClient } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface GenerateSeatingRequest {
	eventId: string;
	totalTables: number;
	seatsPerTable: number;
	roundNumber: number; // 前半(1) or 後半(2)
}

/**
 * 席替えくじ生成API
 * POST /api/seating/generate
 * 
 * 機能:
 * - イベントの決済済み参加者リストを取得
 * - パートナー税理士を各テーブルに分散配置（固定）
 * - 足が不自由な方を入口近くのテーブルに配置
 * - 残りの参加者をランダムにテーブルへ割り当て
 * - 結果をtrn_seating_assignmentテーブルに保存
 */
export async function POST(request: Request) {
	try {
		// 認証 + Supabaseクライアント取得（Cookie or Bearer 両対応）
		const authResult = await getAuthenticatedClient();
		if (authResult.error) {
			return NextResponse.json(
				{ error: authResult.error === '認証が必要です' ? 'Unauthorized' : authResult.error },
				{ status: authResult.status }
			);
		}
		const { client: supabase, userId, isBearer } = authResult;

		// 席替えくじ生成は運営/講師のみ許可。
		// Cookie経路では RLS が INSERT/UPDATE を制限するが、Bearer経路では
		// admin client で RLS がバイパスされるため、コード側で明示チェックする。
		if (isBearer) {
			const adminCheck = createAdminClient();
			const { data: userGroups } = await adminCheck
				.from('trn_group_user')
				.select('mst_group!inner(title)')
				.eq('user_id', userId)
				.is('deleted_at', null);

			const titles = (userGroups || []).map(
				(g: any) => g.mst_group?.title as string,
			);
			const isAdminOrInstructor =
				titles.includes('運営') || titles.includes('講師');
			if (!isAdminOrInstructor) {
				return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
			}
		}

		// リクエストボディのパース
		const body: GenerateSeatingRequest = await request.json();
		const { eventId, totalTables, seatsPerTable, roundNumber } = body;

		// バリデーション
		if (!eventId || !totalTables || !seatsPerTable || !roundNumber) {
			return NextResponse.json(
				{ error: 'Missing required parameters' },
				{ status: 400 }
			);
		}

		if (totalTables < 1 || seatsPerTable < 1) {
			return NextResponse.json(
				{ error: 'Invalid table or seat configuration' },
				{ status: 400 }
			);
		}

		if (roundNumber !== 1 && roundNumber !== 2) {
			return NextResponse.json(
				{ error: 'Round number must be 1 or 2' },
				{ status: 400 }
			);
		}

		// 決済済み参加者リストを取得
		const { data: participants, error: participantsError } = await supabase
			.from('trn_gather_attendee')
			.select(`
				user_id,
				mst_user!inner (
					user_id,
					username,
					nickname,
					is_partner_tax_accountant,
					has_mobility_issues
				)
			`)
			.eq('event_id', eventId)
			.eq('stripe_payment_status', 'succeeded')
			.is('deleted_at', null);

		if (participantsError) {
			console.error('Error fetching participants:', participantsError);
			return NextResponse.json(
				{ error: 'Failed to fetch participants' },
				{ status: 500 }
			);
		}

		if (!participants || participants.length === 0) {
			return NextResponse.json(
				{ error: 'No paid participants found' },
				{ status: 404 }
			);
		}

		// ヘルパー関数: 空きがあるテーブルを見つける
		const findAvailableTable = (
			currentAssignments: { table_number: number }[],
			totalTables: number,
			seatsPerTable: number
		): number | null => {
			for (let tableNum = 1; tableNum <= totalTables; tableNum++) {
				const tableAssignments = currentAssignments.filter((a) => a.table_number === tableNum);
				if (tableAssignments.length < seatsPerTable) {
					return tableNum;
				}
			}
			return null;
		};

		// ユーザー情報を平坦化
		const users = participants.map((p: any) => ({
			user_id: p.user_id,
			username: p.mst_user?.username || '',
			nickname: p.mst_user?.nickname || '',
			is_partner_tax_accountant: p.mst_user?.is_partner_tax_accountant || false,
			has_mobility_issues: p.mst_user?.has_mobility_issues || false,
		}));

		// パートナー税理士と一般参加者に分類
		const partnerTaxAccountants = users.filter((u) => u.is_partner_tax_accountant);
		const mobilityIssueUsers = users.filter((u) => !u.is_partner_tax_accountant && u.has_mobility_issues);
		const regularUsers = users.filter((u) => !u.is_partner_tax_accountant && !u.has_mobility_issues);

		// パートナー税理士がテーブル数より多い場合はエラー
		if (partnerTaxAccountants.length > totalTables) {
			return NextResponse.json(
				{ error: `Too many partner tax accountants (${partnerTaxAccountants.length}) for ${totalTables} tables` },
				{ status: 400 }
			);
		}

		// 全参加者数がテーブル数×席数を超える場合はエラー
		const totalCapacity = totalTables * seatsPerTable;
		if (users.length > totalCapacity) {
			return NextResponse.json(
				{ error: `Too many participants (${users.length}) for total capacity (${totalCapacity})` },
				{ status: 400 }
			);
		}

		// シャッフル関数
		const shuffle = <T>(array: T[]): T[] => {
			const shuffled = [...array];
			for (let i = shuffled.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
			}
			return shuffled;
		};

		// 配席アルゴリズム
		const assignments: {
			user_id: string;
			table_number: number;
			is_fixed: boolean;
			is_accessible_seat: boolean;
		}[] = [];

		// 1. パートナー税理士を各テーブルに分散配置（固定）
		const shuffledPartners = shuffle(partnerTaxAccountants);
		for (let i = 0; i < shuffledPartners.length; i++) {
			assignments.push({
				user_id: shuffledPartners[i].user_id,
				table_number: i + 1, // テーブル番号は1から
				is_fixed: true,
				is_accessible_seat: false,
			});
		}

		// 2. 足が不自由な方を入口近く（テーブル1-3）に配置
		const accessibleTables = [1, 2, 3];
		const shuffledMobilityUsers = shuffle(mobilityIssueUsers);
		
		for (const user of shuffledMobilityUsers) {
			// 入口近くのテーブルで空きがあるテーブルを探す
			let assigned = false;
			for (const tableNum of accessibleTables) {
				const tableAssignments = assignments.filter((a) => a.table_number === tableNum);
				if (tableAssignments.length < seatsPerTable) {
					assignments.push({
						user_id: user.user_id,
						table_number: tableNum,
						is_fixed: false,
						is_accessible_seat: true,
					});
					assigned = true;
					break;
				}
			}
			// 入口近くが満席の場合は他のテーブルへ
			if (!assigned) {
				const availableTable = findAvailableTable(assignments, totalTables, seatsPerTable);
				if (availableTable) {
					assignments.push({
						user_id: user.user_id,
						table_number: availableTable,
						is_fixed: false,
						is_accessible_seat: true,
					});
				}
			}
		}

		// 3. 残りの一般参加者をランダムに割り当て
		const shuffledRegularUsers = shuffle(regularUsers);
		for (const user of shuffledRegularUsers) {
			const availableTable = findAvailableTable(assignments, totalTables, seatsPerTable);
			if (availableTable) {
				assignments.push({
					user_id: user.user_id,
					table_number: availableTable,
					is_fixed: false,
					is_accessible_seat: false,
				});
			}
		}

		// 4. 既存の配席データを削除（論理削除）
		const { error: deleteError } = await supabase
			.from('trn_seating_assignment')
			.update({ deleted_at: new Date().toISOString() })
			.eq('event_id', eventId)
			.eq('round_number', roundNumber)
			.is('deleted_at', null);

		if (deleteError) {
			console.error('Error deleting old assignments:', deleteError);
			return NextResponse.json(
				{ error: 'Failed to delete old assignments' },
				{ status: 500 }
			);
		}

		// 5. 新しい配席データをINSERT
		const insertData = assignments.map((a) => ({
			event_id: eventId,
			user_id: a.user_id,
			table_number: a.table_number,
			round_number: roundNumber,
			is_fixed: a.is_fixed,
			is_accessible_seat: a.is_accessible_seat,
		}));

		const { error: insertError } = await supabase
			.from('trn_seating_assignment')
			.insert(insertData);

		if (insertError) {
			console.error('Error inserting assignments:', insertError);
			return NextResponse.json(
				{ error: 'Failed to save seating assignments' },
				{ status: 500 }
			);
		}

		// 6. 成功レスポンス
		return NextResponse.json({
			success: true,
			message: 'Seating assignments generated successfully',
			data: {
				eventId,
				roundNumber,
				totalParticipants: users.length,
				totalTables,
				seatsPerTable,
				partnerTaxAccountants: partnerTaxAccountants.length,
				mobilityIssueUsers: mobilityIssueUsers.length,
				assignments: assignments.length,
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
