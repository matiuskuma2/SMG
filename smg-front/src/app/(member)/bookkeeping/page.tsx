'use client';
import ListContent from '@/components/ui/ListContent';
import { createClient } from '@/lib/supabase';
import type { Event } from '@/types/event';
import React, { Suspense, useState, useEffect, useCallback } from 'react';

const BookkeepingListContent = () => {
	const [hasAccess, setHasAccess] = useState<boolean | null>(null);

	// ユーザーが簿記講座にアクセス可能かチェック
	useEffect(() => {
		const checkGroupAccess = async () => {
			try {
				const supabase = createClient();

				// ログインユーザーのIDを取得
				const {
					data: { user },
				} = await supabase.auth.getUser();
				const userId = user?.id;

				if (!userId) {
					setHasAccess(false);
					return;
				}

				// mst_groupテーブルから「簿記3期」「運営」「講師」グループのIDを取得
				const { data: groupData, error: groupError } = await supabase
					.from('mst_group')
					.select('group_id, title')
					.in('title', ['簿記3期', '運営', '講師'])
					.is('deleted_at', null);

				if (groupError) {
					console.error('グループ取得エラー:', groupError);
					setHasAccess(false);
					return;
				}

				if (!groupData || groupData.length === 0) {
					console.error(
						'必要なグループ（簿記3期、運営、講師）が見つかりません',
					);
					setHasAccess(false);
					return;
				}

				const basicGroupIds = groupData.map((group) => group.group_id);

				// trn_event_visible_groupから表示制限グループIDを取得
				const { data: visibleGroupData, error: visibleGroupError } =
					await supabase
						.from('trn_event_visible_group')
						.select('group_id')
						.is('deleted_at', null);

				if (visibleGroupError) {
					console.error('表示制限グループ取得エラー:', visibleGroupError);
				}

				const visibleGroupIds = Array.from(
					new Set(visibleGroupData?.map((vg) => vg.group_id) || []),
				);

				// ユーザーが所属するグループを確認
				const allPossibleGroupIds = Array.from(
					new Set([...basicGroupIds, ...visibleGroupIds]),
				);

				if (allPossibleGroupIds.length === 0) {
					setHasAccess(false);
					return;
				}

				const { data: userGroupData, error: userGroupError } = await supabase
					.from('trn_group_user')
					.select('group_id')
					.in('group_id', allPossibleGroupIds)
					.eq('user_id', userId)
					.is('deleted_at', null);

				if (userGroupError) {
					console.error('グループ所属確認エラー:', userGroupError);
					setHasAccess(false);
					return;
				}

				const userGroupIds = userGroupData?.map((ug) => ug.group_id) || [];

				// 基本グループまたは表示制限グループのいずれかに所属していればアクセス可能
				const hasBasicAccess = userGroupIds.some((groupId) =>
					basicGroupIds.includes(groupId),
				);
				const hasVisibleAccess = userGroupIds.some((groupId) =>
					visibleGroupIds.includes(groupId),
				);

				setHasAccess(hasBasicAccess || hasVisibleAccess);
			} catch (error) {
				console.error('アクセス確認エラー:', error);
				setHasAccess(false);
			}
		};

		checkGroupAccess();
	}, []);

	// Supabaseから簿記講座データを取得する関数
	const fetchBookkeepingCourses = useCallback(
		async (
			searchTerm?: string,
			sortOption?: string,
			page = 1,
			pageSize = 5,
			filters?: {
				locations?: string[];
				formats?: string[];
				eventTypes?: string[];
				applied?: boolean;
			},
		): Promise<{ items: Event[]; totalCount: number }> => {
			if (!hasAccess) {
				return { items: [], totalCount: 0 };
			}

			try {
				const supabase = createClient();

				// ログインユーザーのIDを取得
				const {
					data: { user },
				} = await supabase.auth.getUser();
				const userId = user?.id;

				// 基本グループ（簿記3期、運営、講師）のIDを取得
				const { data: basicGroupData } = await supabase
					.from('mst_group')
					.select('group_id, title')
					.in('title', ['簿記3期', '運営', '講師'])
					.is('deleted_at', null);

				const basicGroupIds =
					basicGroupData?.map((group) => group.group_id) || [];

				// ユーザーが所属するグループのIDを取得
				let userGroupIds: string[] = [];
				let hasFullAccess = false;

				if (userId) {
					const { data: userGroups, error: userGroupError } = await supabase
						.from('trn_group_user')
						.select('group_id')
						.eq('user_id', userId)
						.is('deleted_at', null);

					if (userGroupError) {
						console.error('Error fetching user groups:', userGroupError);
						return { items: [], totalCount: 0 };
					}
					userGroupIds = userGroups.map((ug) => ug.group_id);
					// ユーザーが基本グループ（簿記3期、運営、講師）に所属しているかチェック
					hasFullAccess = userGroupIds.some((groupId) =>
						basicGroupIds.includes(groupId),
					);
				}

				// 簿記講座のイベントタイプIDを取得（簿記講座のevent_type_idを想定）
				const { data: eventTypeData } = await supabase
					.from('mst_event_type')
					.select('event_type_id')
					.eq('event_type_name', '簿記講座')
					.is('deleted_at', null);

				const bookkeepingTypeId = eventTypeData?.[0]?.event_type_id || '';

				// 簿記講座のデータを取得
				const eventQuery = supabase
					.from('mst_event')
					.select(`
          *,
          mst_event_type (
            event_type_name
          ),
          mst_event_file (
            file_id,
            file_description,
            file_name,
            file_url,
            display_order,
            deleted_at
          )
        `)
					.eq('event_type', bookkeepingTypeId)
					.is('deleted_at', null)
					.eq('is_draft', false)
					.lte('publish_start_at', new Date().toISOString())
					.gte('publish_end_at', new Date().toISOString());

				// すべてのイベントを取得
				const { data: eventData, error: eventError } = await eventQuery;

				if (eventError) {
					console.error('Error fetching events:', eventError);
					return { items: [], totalCount: 0 };
				}

				let filteredEventData = eventData;

				if (!hasFullAccess) {
					// 基本グループに所属していない場合は、表示制限グループで許可されたイベントのみ表示
					const { data: visibleEvents, error: visibleError } = await supabase
						.from('trn_event_visible_group')
						.select('event_id')
						.in('group_id', userGroupIds)
						.is('deleted_at', null);

					if (visibleError) {
						console.error('Error fetching visible events:', visibleError);
						return { items: [], totalCount: 0 };
					}

					const visibleEventIds = new Set(
						visibleEvents?.map((ve) => ve.event_id) || [],
					);

					// ユーザーのグループで表示可能なイベントのみをフィルタリング
					filteredEventData = eventData.filter((event) =>
						visibleEventIds.has(event.event_id),
					);
				}

				// フィルタリング後にイベントがない場合は早期リターン
				if (filteredEventData.length === 0) {
					return { items: [], totalCount: 0 };
				}

				// すべての簿記講座のIDを取得
				const eventIds = filteredEventData.map((event) => event.event_id);

				// 参加者数を取得（オフライン参加者のみ）
				const { data: attendeeData, error: attendeeError } = await supabase
					.from('trn_event_attendee')
					.select('event_id, user_id')
					.in('event_id', eventIds)
					.eq('is_offline', true)
					.is('deleted_at', null);

				if (attendeeError) {
					console.error('Error fetching attendees:', attendeeError);
				}

				// イベントごとの参加者数を集計
				const attendeeCounts: { [key: string]: number } = {};
				const userAppliedEvents: Set<string> = new Set();

				attendeeData?.forEach((attendee) => {
					attendeeCounts[attendee.event_id] =
						(attendeeCounts[attendee.event_id] || 0) + 1;

					// ログインユーザーが申し込んでいるイベントを記録
					if (attendee.user_id === userId) {
						userAppliedEvents.add(attendee.event_id);
					}
				});

				// データを変換
				let formattedCourses = filteredEventData.map((event) => {
					return {
						event_id: event.event_id,
						event_name: event.event_name,
						event_start_datetime: event.event_start_datetime,
						event_end_datetime: event.event_end_datetime,
						event_location: event.event_location,
						event_city: event.event_city,
						event_description: event.event_description,
						event_capacity: event.event_capacity,
						event_type: event.event_type,
						event_type_name: event.mst_event_type?.event_type_name,
						image_url: event.image_url,
						has_consultation: event.has_consultation,
						has_gather: event.has_gather,
						consultation_capacity: event.consultation_capacity,
						gather_capacity: event.gather_capacity,
						gather_price: event.gather_price,
						gather_start_time: event.gather_start_time,
						gather_end_time: event.gather_end_time,
						gather_location: event.gather_location,
						registration_start_datetime: event.registration_start_datetime,
						registration_end_datetime: event.registration_end_datetime,
						publish_start_at: event.publish_start_at,
						publish_end_at: event.publish_end_at,
						spreadsheet_id: event.spreadsheet_id,
						created_at: event.created_at,
						updated_at: event.updated_at,
						deleted_at: event.deleted_at,
						is_draft: event.is_draft,
						notification_sent: event.notification_sent ?? false,
						gather_registration_end_datetime: event.gather_registration_end_datetime || null,
						is_applied: userAppliedEvents.has(event.event_id),
						participants_count: attendeeCounts[event.event_id] || 0,
						visible_group_ids: [], // 新しい構造では複数のグループIDが可能
						files:
							event.mst_event_file
								?.filter(
									(file: { deleted_at: string | null }) => !file.deleted_at,
								)
								.sort(
									(
										a: { display_order: number | null },
										b: { display_order: number | null },
									) => {
										const orderA = a.display_order ?? 0;
										const orderB = b.display_order ?? 0;
										return orderA - orderB;
									},
								) || [],
					};
				});

				// 申し込み済みフィルター
				if (filters?.applied) {
					formattedCourses = formattedCourses.filter((course) =>
						userAppliedEvents.has(course.event_id),
					);
				}

				// 開催地フィルター
				if (filters?.locations && filters.locations.length > 0) {
					const locationMap: { [key: string]: string } = {
						tokyo: '東京',
						osaka: '大阪',
						fukuoka: '福岡',
						sendai: '仙台',
						nagoya: '名古屋',
						online: 'オンライン',
					};
					const locationValues = filters.locations
						.map((loc) => locationMap[loc])
						.filter(Boolean);
					formattedCourses = formattedCourses.filter((course) =>
						locationValues.some((loc) => course.event_city?.includes(loc)),
					);
				}

				// 検索フィルタリング
				if (searchTerm) {
					formattedCourses = formattedCourses.filter((course) =>
						course.event_name.toLowerCase().includes(searchTerm.toLowerCase()),
					);
				}

				// ソート処理
				if (sortOption === 'date_asc') {
					// 開催日順（昇順）- 近い順
					formattedCourses.sort(
						(a, b) =>
							new Date(a.event_start_datetime).getTime() -
							new Date(b.event_start_datetime).getTime(),
					);
				} else if (sortOption === 'participants') {
					// 参加人数順（降順）
					formattedCourses.sort(
						(a, b) => b.participants_count - a.participants_count,
					);
				} else if (sortOption === 'participants_asc') {
					// 参加人数順（昇順）
					formattedCourses.sort(
						(a, b) => a.participants_count - b.participants_count,
					);
				} else if (sortOption === 'capacity') {
					// 定員数順（降順）
					formattedCourses.sort((a, b) => b.event_capacity - a.event_capacity);
				} else if (sortOption === 'capacity_asc') {
					// 定員数順（昇順）
					formattedCourses.sort((a, b) => a.event_capacity - b.event_capacity);
				} else {
					// デフォルトは開催日順（降順）- 遠い順
					formattedCourses.sort(
						(a, b) =>
							new Date(b.event_start_datetime).getTime() -
							new Date(a.event_start_datetime).getTime(),
					);
				}

				// ページネーション適用
				const totalCount = formattedCourses.length;
				const start = (page - 1) * pageSize;
				const end = start + pageSize;
				const paginatedCourses = formattedCourses.slice(start, end);

				return {
					items: paginatedCourses,
					totalCount,
				};
			} catch (error) {
				console.error('Error:', error);
				return { items: [], totalCount: 0 };
			}
		},
		[hasAccess],
	);

	const sortOptions = [
		{ value: 'date_asc', label: '開催日順（昇順）' },
		{ value: 'date', label: '開催日順（降順）' },
		{ value: 'participants_asc', label: '参加人数順（昇順）' },
		{ value: 'participants', label: '参加人数順（降順）' },
		{ value: 'capacity_asc', label: '定員数順（昇順）' },
		{ value: 'capacity', label: '定員数順（降順）' },
	];

	if (hasAccess === false) {
		return (
			<div className="flex flex-col items-center justify-center h-64 w-full">
				<h3 className="text-xl font-medium text-gray-900">
					アクセス権限がありません
				</h3>
				<p className="mt-2 text-gray-600">
					簿記講座を閲覧するには、適切な権限が必要です。
				</p>
			</div>
		);
	}

	if (hasAccess === null) {
		return (
			<div className="flex items-center justify-center h-64 w-full">
				<p className="text-gray-600">読み込み中...</p>
			</div>
		);
	}

	return (
		<ListContent
			fetchItems={fetchBookkeepingCourses}
			bannerImageSrc="/banner.png"
			bannerAlt="簿記講座"
			basePath="/bookkeeping"
			placeholderText="簿記講座名で検索"
			emptyText="簿記講座が見つかりませんでした。"
			sortOptions={sortOptions}
			defaultSortOption="date_asc"
			disabledFilters={{ eventType: true, format: true }}
		/>
	);
};

const BookkeepingListPaginated = () => {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<BookkeepingListContent />
		</Suspense>
	);
};

export default BookkeepingListPaginated;
