import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

// 取得対象のイベントタイプ
const EVENT_TYPE_NAMES = [
	'定例会',
	'5大都市グループ相談会&交流会',
	'PDCA会議実践講座',
	'簿記講座',
	'オンラインセミナー',
	'特別セミナー',
];

// 簿記講座グループ名
const BOOKKEEPING_GROUP_NAME = '簿記講座';

export const fetchEvents = async () => {
	const client = createClient();
	const {
		data: { user },
		error,
	} = await client.auth.getUser();

	if (error || !user) return redirect('/login');

	// 簿記講座グループのIDを取得
	const { data: bookkeepingGroup } = await client
		.from('mst_group')
		.select('group_id')
		.eq('title', BOOKKEEPING_GROUP_NAME)
		.is('deleted_at', null)
		.single();

	const bookkeepingGroupId = bookkeepingGroup?.group_id;

	// ユーザーが所属するグループのIDを取得
	const { data: userGroups } = await client
		.from('trn_group_user')
		.select('group_id')
		.eq('user_id', user.id)
		.is('deleted_at', null);

	const userGroupIds = userGroups?.map((ug) => ug.group_id) ?? [];

	// ユーザーが簿記講座グループに所属しているか確認
	const isBookkeepingMember = bookkeepingGroupId
		? userGroupIds.includes(bookkeepingGroupId)
		: false;

	// 簿記講座グループに所属していない場合は、簿記講座を取得対象から除外
	const targetEventTypes = isBookkeepingMember
		? EVENT_TYPE_NAMES
		: EVENT_TYPE_NAMES.filter((name) => name !== '簿記講座');

	// グループ制限があるイベントIDを取得
	const { data: restrictedEvents } = await client
		.from('trn_event_visible_group')
		.select('event_id')
		.is('deleted_at', null);

	const restrictedEventIds = new Set(
		restrictedEvents?.map((re) => re.event_id) ?? [],
	);

	// ユーザーが閲覧可能なイベントIDを取得
	let visibleEventIds: string[] = [];
	if (userGroupIds.length > 0) {
		const { data: visibleEvents } = await client
			.from('trn_event_visible_group')
			.select('event_id')
			.in('group_id', userGroupIds)
			.is('deleted_at', null);

		visibleEventIds = visibleEvents?.map((ve) => ve.event_id) ?? [];
	}

	// 除外するイベントIDを計算（制限があるが、ユーザーが閲覧できないイベント）
	const excludeEventIds = Array.from(restrictedEventIds).filter(
		(eventId) => !visibleEventIds.includes(eventId),
	);

	const now = new Date().toISOString();

	// イベントタイプIDを取得
	const { data: eventTypes } = await client
		.from('mst_event_type')
		.select('event_type_id, event_type_name')
		.in('event_type_name', targetEventTypes)
		.is('deleted_at', null);

	const eventTypeMap = new Map(
		eventTypes?.map((et) => [et.event_type_name, et.event_type_id]) ?? [],
	);

	// 各イベントタイプごとに3件ずつ取得
	const eventPromises = targetEventTypes.map(async (typeName) => {
		const typeId = eventTypeMap.get(typeName);
		if (!typeId) return [];

		let eventQuery = client
			.from('mst_event')
			.select(
				`
				id:event_id,
				name:event_name,
				imageUrl:image_url,
				event_start_datetime,
				event_end_datetime,
				registration_start_datetime,
				registration_end_datetime,
				type:event_type( name:event_type_name ),
				city:event_city
			`,
			)
			.is('deleted_at', null)
			.eq('is_draft', false)
			.eq('event_type', typeId)
			.lte('publish_start_at', now)
			.gte('publish_end_at', now)
			.gte('event_end_datetime', now);

		// グループ制限フィルタリング
		if (excludeEventIds.length > 0) {
			eventQuery = eventQuery.not(
				'event_id',
				'in',
				`(${excludeEventIds.join(',')})`,
			);
		}

		const { data } = await eventQuery
			.order('event_start_datetime', { ascending: true })
			.limit(3);

		return data ?? [];
	});

	const eventsByType = await Promise.all(eventPromises);
	const allEvents = eventsByType.flat();

	const { data: attendee } = await client
		.from('trn_event_attendee')
		.select('event_id')
		.eq('user_id', user.id)
		.is('deleted_at', null)
		.in('event_id', allEvents?.map((d) => d.id) ?? []);

	const attendEvents = attendee?.map((d) => d.event_id) ?? [];

	const fixed = (allEvents ?? []).map((d) => ({
		...d,
		isAttendee: attendEvents.includes(d.id),
	}));

	// 申込済みイベント（トップ表示用）
	const [
		{ data: userAttendees },
		{ data: userGathers },
		{ data: userConsultations },
	] = await Promise.all([
		client
			.from('trn_event_attendee')
			.select('event_id')
			.eq('user_id', user.id)
			.is('deleted_at', null),
		client
			.from('trn_gather_attendee')
			.select('event_id')
			.eq('user_id', user.id)
			.is('deleted_at', null),
		client
			.from('trn_consultation_attendee')
			.select('event_id')
			.eq('user_id', user.id)
			.is('deleted_at', null),
	]);

	const appliedEventIds = [
		...new Set([
			...(userAttendees?.map((d) => d.event_id) ?? []),
			...(userGathers?.map((d) => d.event_id) ?? []),
			...(userConsultations?.map((d) => d.event_id) ?? []),
		]),
	];

	let appliedEvents: { id: string; event_name: string }[] = [];
	if (appliedEventIds.length > 0) {
		let appliedQuery = client
			.from('mst_event')
			.select('event_id, event_name')
			.in('event_id', appliedEventIds)
			.is('deleted_at', null)
			.eq('is_draft', false)
			.lte('publish_start_at', now)
			.gte('publish_end_at', now)
			.gte('event_end_datetime', now)
			.order('event_start_datetime', { ascending: true })
			.limit(3);

		if (excludeEventIds.length > 0) {
			appliedQuery = appliedQuery.not(
				'event_id',
				'in',
				`(${excludeEventIds.join(',')})`,
			);
		}

		const { data } = await appliedQuery;
		appliedEvents =
			data?.map((event) => ({
				id: event.event_id,
				event_name: event.event_name,
			})) ?? [];
	}

	return {
		fixed,
		appliedEvents,
	};
};
