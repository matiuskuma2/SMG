'use client';
import ListContent from '@/components/ui/ListContent';
import { getEvents } from '@/lib/api/event';
import { getEventTypes } from '@/lib/api/event-type';
import type { Event } from '@/types/event';
import React, { Suspense, useCallback, useEffect, useState } from 'react';

const EventListContent = () => {
	const [eventTypeOptions, setEventTypeOptions] = useState<
		{ id: string; name: string }[]
	>([]);

	// イベントタイプを取得
	useEffect(() => {
		const loadEventTypes = async () => {
			const types = await getEventTypes();
			setEventTypeOptions(types);
		};
		loadEventTypes();
	}, []);

	// イベントデータを取得する関数（サーバーサイドページネーション対応）
	const fetchEvents = useCallback(
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
			try {
				const { events, totalCount } = await getEvents(
					searchTerm,
					sortOption,
					undefined, // eventTypeId
					page,
					pageSize,
					filters,
				);
				return { items: events, totalCount };
			} catch (error) {
				console.error('Error:', error);
				return { items: [], totalCount: 0 };
			}
		},
		[],
	);

	const sortOptions = [
		{ value: 'date_asc', label: '開催日順（昇順）' },
		{ value: 'date', label: '開催日順（降順）' },
		{ value: 'participants_asc', label: '参加人数順（昇順）' },
		{ value: 'participants', label: '参加人数順（降順）' },
		{ value: 'capacity_asc', label: '定員数順（昇順）' },
		{ value: 'capacity', label: '定員数順（降順）' },
	];

	return (
		<ListContent
			fetchItems={fetchEvents}
			bannerImageSrc="/banner.png"
			bannerAlt="smgイベント"
			basePath="/events"
			placeholderText="イベント名で検索"
			emptyText="イベントが見つかりませんでした。"
			sortOptions={sortOptions}
			defaultSortOption="date_asc"
			itemsPerPage={5}
			eventTypeOptions={eventTypeOptions}
		/>
	);
};

const EventListPaginated = () => {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<EventListContent />
		</Suspense>
	);
};

export default EventListPaginated;
