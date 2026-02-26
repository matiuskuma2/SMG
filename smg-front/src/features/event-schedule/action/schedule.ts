'use server';

import { createClient } from '@/lib/supabase-server';
import dayjs, { type Dayjs } from 'dayjs';
import { redirect } from 'next/navigation';
import { type EVENT_PUBLISH_STATUS, getPublishStatus } from '../lib/event';

const selectText = `
  id:event_id,
  name:event_name,
  startDatetime:event_start_datetime,
	endDatetime:event_end_datetime,
  city:event_city,
	registStartAt:registration_start_datetime,
	registEndAt:registration_end_datetime,
  type:event_type (
    id:event_type_id,
    name:event_type_name
  )
`;

export type Schedule = {
	id: string;
	name: string;
	startDatetime: string;
	endDatetime: string;
	city: string | null;
	type: {
		id: string;
		name: string;
	};
	isOnline: boolean;
	publishStatus: EVENT_PUBLISH_STATUS;
	hasApplied: boolean;
	hasValidApplication: boolean;
};

export const fetchEventSchedules = async (
	month: Dayjs | string = dayjs(),
	options?: { startDate?: Dayjs; endDate?: Dayjs },
) => {
	const targetMonth = dayjs.isDayjs(month) ? month : dayjs(month);

	// オプションがあればその範囲、なければ月の範囲
	const startDate = options?.startDate ?? targetMonth.startOf('month');
	const endDate = options?.endDate ?? targetMonth.endOf('month');

	const client = createClient();
	const {
		data: { user },
	} = await client.auth.getUser();

	if (!user) redirect('/login');

	const now = dayjs().toISOString();

	// ユーザーが所属するグループのIDを取得
	let userGroupIds: string[] = [];
	const { data: userGroups, error: userGroupError } = await client
		.from('trn_group_user')
		.select('group_id')
		.eq('user_id', user.id)
		.is('deleted_at', null);

	if (userGroupError) {
		console.error('Error fetching user groups:', userGroupError);
	} else {
		userGroupIds = userGroups?.map((ug) => ug.group_id) || [];
	}

	// 基本グループ（簿記3期、運営、講師）のIDを取得
	const { data: basicGroupData } = await client
		.from('mst_group')
		.select('group_id')
		.in('title', ['簿記3期', '運営', '講師'])
		.is('deleted_at', null);

	const basicGroupIds = basicGroupData?.map((g) => g.group_id) || [];

	// ユーザーが基本グループに所属しているかチェック
	const hasFullAccess = userGroupIds.some((groupId) =>
		basicGroupIds.includes(groupId),
	);

	// 簿記講座のイベントタイプIDを取得
	const { data: bookkeepingTypeData } = await client
		.from('mst_event_type')
		.select('event_type_id')
		.eq('event_type_name', '簿記講座')
		.is('deleted_at', null);

	const bookkeepingTypeId = bookkeepingTypeData?.[0]?.event_type_id || '';

	// イベント取得
	const { data, error } = await client
		.from('mst_event')
		.select(selectText)
		.is('deleted_at', null)
		.gte('event_start_datetime', startDate.toISOString())
		.lte('event_start_datetime', endDate.toISOString())
		.not('event_type', 'is', null)
		.lte('publish_start_at', now)
		.gte('publish_end_at', now)
		.order('event_start_datetime', { ascending: true });

	if (error || !data) return [];

	// trn_event_visible_groupを使用したグループベースのフィルタリング
	let visibleEventIds: string[] = [];

	if (userGroupIds.length > 0) {
		// ユーザーのグループに表示可能なイベントIDを取得
		const { data: visibleEvents, error: visibleError } = await client
			.from('trn_event_visible_group')
			.select('event_id')
			.in('group_id', userGroupIds)
			.is('deleted_at', null);

		if (visibleError) {
			console.error('Error fetching visible events:', visibleError);
		} else {
			visibleEventIds = visibleEvents?.map((ve) => ve.event_id) || [];
		}
	}

	// グループ制限があるイベントを取得
	const { data: restrictedEvents, error: restrictedError } = await client
		.from('trn_event_visible_group')
		.select('event_id')
		.is('deleted_at', null);

	if (restrictedError) {
		console.error('Error fetching restricted events:', restrictedError);
	}

	const restrictedEventIds = new Set(
		restrictedEvents?.map((re) => re.event_id) || [],
	);

	// フィルタリング
	const filteredData = data.filter((event) => {
		const isBookkeeping = event.type?.id === bookkeepingTypeId;

		if (isBookkeeping) {
			// 簿記講座の場合
			if (hasFullAccess) {
				// 基本グループ所属 → 全て表示
				return true;
			}
			// 基本グループに所属していない場合は表示制限グループで許可されたイベントのみ
			return visibleEventIds.includes(event.id);
		}

		// 簿記講座以外のイベントの場合
		if (!restrictedEventIds.has(event.id)) {
			// 制限がないイベントは表示
			return true;
		}
		// 制限があるイベントはユーザーのグループに含まれている場合のみ表示
		return visibleEventIds.includes(event.id);
	});

	const eventIds = filteredData.map((e) => e.id);
	if (eventIds.length === 0) return [];

	// 申込データ取得
	const [{ data: attendeeData }, { data: gatherData }] = await Promise.all([
		client
			.from('trn_event_attendee')
			.select('event_id, deleted_at')
			.in('event_id', eventIds)
			.eq('user_id', user.id),
		client
			.from('trn_gather_attendee')
			.select('event_id, deleted_at')
			.in('event_id', eventIds)
			.eq('user_id', user.id),
	]);

	// イベントIDごとの申込状況
	const applicationMap = new Map<
		string,
		{ hasApplied: boolean; hasValid: boolean }
	>();

	for (const eventId of eventIds) {
		const eventAttendees =
			attendeeData?.filter((a) => a.event_id === eventId) || [];
		const gatherAttendees =
			gatherData?.filter((g) => g.event_id === eventId) || [];

		applicationMap.set(eventId, {
			hasApplied: eventAttendees.length > 0 || gatherAttendees.length > 0,
			hasValid:
				eventAttendees.some((a) => a.deleted_at === null) ||
				gatherAttendees.some((a) => a.deleted_at === null),
		});
	}

	// additional Flags
	const additional = filteredData.map((d) => {
		const { registStartAt, registEndAt, ...e } = d;
		const app = applicationMap.get(e.id) || {
			hasApplied: false,
			hasValid: false,
		};

		return {
			...e,
			publishStatus: getPublishStatus(registStartAt, registEndAt),
			isOnline: e.type && e.type.name === 'オンラインセミナー',
			hasApplied: app.hasApplied,
			hasValidApplication: app.hasValid,
		};
	});

	return additional;
};

export const fetchEventType = async () => {
	const client = createClient();
	const { data, error } = await client
		.from('mst_event_type')
		.select('id:event_type_id, name:event_type_name')
		.is('deleted_at', null)
		.order('event_type_id', { ascending: true });

	if (error) return [];

	return data;
};

export const fetchEventCity = async () => {
	const client = createClient();
	const { data, error } = await client.rpc('get_event_city');

	if (!data || error) return [];

	return data.map((d) => d.event_city);
};
