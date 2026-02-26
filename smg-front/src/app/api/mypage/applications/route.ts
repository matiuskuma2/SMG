import { createClient } from '@/lib/supabase-server';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface GroupedEvent {
	eventId: string;
	name: string;
	date: string;
	location: string;
	isOffline: boolean;
	hasEvent: boolean;
	hasGather: boolean;
	hasConsultation: boolean;
	eventStartDatetime: string;
	eventEndDatetime: string;
	createdAt: string;
}

function formatDateJP(dateStr: string): string {
	const date = new Date(dateStr);

	const dateParts = new Intl.DateTimeFormat('ja-JP', {
		timeZone: 'Asia/Tokyo',
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
	}).formatToParts(date);

	const year = dateParts.find((part) => part.type === 'year')?.value ?? '';
	const month = dateParts.find((part) => part.type === 'month')?.value ?? '';
	const day = dateParts.find((part) => part.type === 'day')?.value ?? '';

	const timeParts = new Intl.DateTimeFormat('ja-JP', {
		timeZone: 'Asia/Tokyo',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	}).formatToParts(date);

	const hour = timeParts.find((part) => part.type === 'hour')?.value ?? '';
	const minute = timeParts.find((part) => part.type === 'minute')?.value ?? '';

	return `${year}年${month}月${day}日 ${hour}時${minute}分`;
}

export async function GET(request: NextRequest) {
	try {
		const supabase = createClient();

		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const page = Number.parseInt(searchParams.get('page') || '1', 10);
		const limit = Number.parseInt(searchParams.get('limit') || '10', 10);
		const offset = (page - 1) * limit;

		// 3テーブルから並行取得（懇親会・個別相談はevent_idのみ）
		const [eventResult, gatherResult, consultationResult] = await Promise.all([
			supabase
				.from('trn_event_attendee')
				.select(`
					event_id,
					is_offline,
					created_at,
					mst_event (
						event_name,
						event_start_datetime,
						event_end_datetime,
						event_location
					)
				`)
				.eq('user_id', user.id)
				.is('deleted_at', null),

			supabase
				.from('trn_gather_attendee')
				.select('event_id, created_at')
				.eq('user_id', user.id)
				.is('deleted_at', null),

			supabase
				.from('trn_consultation_attendee')
				.select('event_id, created_at')
				.eq('user_id', user.id)
				.is('deleted_at', null),
		]);

		if (eventResult.error) {
			console.error('イベント申し込み取得エラー:', eventResult.error);
		}
		if (gatherResult.error) {
			console.error('懇親会申し込み取得エラー:', gatherResult.error);
		}
		if (consultationResult.error) {
			console.error('個別相談申し込み取得エラー:', consultationResult.error);
		}

		// イベント単位でグループ化
		const eventMap = new Map<string, GroupedEvent>();

		// イベント申し込み（mst_event情報付き）
		for (const item of eventResult.data || []) {
			const existing = eventMap.get(item.event_id);
			if (existing) {
				existing.hasEvent = true;
			} else {
				eventMap.set(item.event_id, {
					eventId: item.event_id,
					name: item.mst_event?.event_name || 'イベント名不明',
					date: item.mst_event?.event_start_datetime
						? formatDateJP(item.mst_event.event_start_datetime)
						: '日時不明',
					location: item.mst_event?.event_location || '場所不明',
					isOffline: item.is_offline || false,
					hasEvent: true,
					hasGather: false,
					hasConsultation: false,
					eventStartDatetime: item.mst_event?.event_start_datetime || '',
					eventEndDatetime: item.mst_event?.event_end_datetime || '',
					createdAt: item.created_at || '',
				});
			}
		}

		// 懇親会（event_idのみ）
		for (const item of gatherResult.data || []) {
			const existing = eventMap.get(item.event_id);
			if (existing) {
				existing.hasGather = true;
			} else {
				eventMap.set(item.event_id, {
					eventId: item.event_id,
					name: '',
					date: '',
					location: '',
					isOffline: false,
					hasEvent: false,
					hasGather: true,
					hasConsultation: false,
					eventStartDatetime: '',
					eventEndDatetime: '',
					createdAt: item.created_at || '',
				});
			}
		}

		// 個別相談（event_idのみ）
		for (const item of consultationResult.data || []) {
			const existing = eventMap.get(item.event_id);
			if (existing) {
				existing.hasConsultation = true;
			} else {
				eventMap.set(item.event_id, {
					eventId: item.event_id,
					name: '',
					date: '',
					location: '',
					isOffline: false,
					hasEvent: false,
					hasGather: false,
					hasConsultation: true,
					eventStartDatetime: '',
					eventEndDatetime: '',
					createdAt: item.created_at || '',
				});
			}
		}

		// イベント情報が未取得のエントリを補完
		const missingEventIds = Array.from(eventMap.entries())
			.filter(([, v]) => v.name === '')
			.map(([id]) => id);

		if (missingEventIds.length > 0) {
			const { data: missingEvents } = await supabase
				.from('mst_event')
				.select(
					'event_id, event_name, event_start_datetime, event_end_datetime, event_location',
				)
				.in('event_id', missingEventIds);

			for (const evt of missingEvents || []) {
				const entry = eventMap.get(evt.event_id);
				if (entry) {
					entry.name = evt.event_name || 'イベント名不明';
					entry.date = evt.event_start_datetime
						? formatDateJP(evt.event_start_datetime)
						: '日時不明';
					entry.location = evt.event_location || '場所不明';
					entry.eventStartDatetime = evt.event_start_datetime || '';
					entry.eventEndDatetime = evt.event_end_datetime || '';
				}
			}
		}

		const now = Date.now();
		const getStartTime = (event: GroupedEvent) =>
			event.eventStartDatetime
				? new Date(event.eventStartDatetime).getTime()
				: Number.NaN;
		const getEndReferenceTime = (event: GroupedEvent) => {
			if (event.eventEndDatetime) {
				return new Date(event.eventEndDatetime).getTime();
			}
			if (event.eventStartDatetime) {
				return new Date(event.eventStartDatetime).getTime();
			}
			return Number.NaN;
		};
		const isEnded = (event: GroupedEvent) => {
			const endReferenceTime = getEndReferenceTime(event);
			return Number.isFinite(endReferenceTime) && endReferenceTime < now;
		};

		const compareByStartAsc = (a: GroupedEvent, b: GroupedEvent) => {
			const aTime = getStartTime(a);
			const bTime = getStartTime(b);
			if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
				return 0;
			}
			if (Number.isNaN(aTime)) {
				return 1;
			}
			if (Number.isNaN(bTime)) {
				return -1;
			}
			return aTime - bTime;
		};

		const compareByStartDesc = (a: GroupedEvent, b: GroupedEvent) => {
			const aTime = getStartTime(a);
			const bTime = getStartTime(b);
			if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
				return 0;
			}
			if (Number.isNaN(aTime)) {
				return 1;
			}
			if (Number.isNaN(bTime)) {
				return -1;
			}
			return bTime - aTime;
		};

		// 未終了イベント（開始日時昇順）→終了イベント（開始日時降順）の順で並べる
		const groupedEvents = Array.from(eventMap.values());
		const nonEndedEvents = groupedEvents
			.filter((event) => !isEnded(event))
			.sort(compareByStartAsc);
		const endedEvents = groupedEvents
			.filter((event) => isEnded(event))
			.sort(compareByStartDesc);
		const allEvents = [...nonEndedEvents, ...endedEvents];

		const totalCount = allEvents.length;
		const paginatedEvents = allEvents.slice(offset, offset + limit);

		const events = paginatedEvents.map(
			({ createdAt, eventStartDatetime, eventEndDatetime, ...rest }) => ({
				...rest,
				isEnded: isEnded({
					...rest,
					eventStartDatetime,
					eventEndDatetime,
					createdAt,
				}),
			}),
		);

		return NextResponse.json({
			events,
			totalCount,
			currentPage: page,
			totalPages: Math.ceil(totalCount / limit),
		});
	} catch (error) {
		console.error('API エラー:', error);
		return NextResponse.json(
			{ error: 'サーバーエラーが発生しました' },
			{ status: 500 },
		);
	}
}
