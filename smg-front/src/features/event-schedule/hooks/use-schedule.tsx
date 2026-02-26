'use client';

import { createContext } from '@/features/admin/lib/create-context';
import dayjs from '@/lib/dayjs';
import { useCallback, useMemo, useState } from 'react';
import type { Schedule } from '../action/schedule';

type ScheduleContext = {
	schedules: Schedule[];
	eventTypes: {
		id: string;
		name: string;
	}[];
	eventCity: string[];
	setFieldByKey: <TKey extends keyof Fields>(
		key: TKey,
		value: Fields[TKey],
	) => void;
	fieldValues: Fields;
};

export const [ScheduleContext, useScheduleContext] =
	createContext<ScheduleContext>({
		schedules: [],
		eventTypes: [],
		eventCity: [],
		setFieldByKey: () => {},
		fieldValues: {
			isOnlyApplied: false,
			selectedTypes: [],
			selectedCities: [],
			selectedFormat: [],
			searchTerm: '',
			zoomLevel: 100,
			viewMode: 'month',
			selectedDate: null,
		},
	});

type Fields = {
	isOnlyApplied: boolean;
	selectedCities: string[];
	selectedTypes: string[];
	selectedFormat: string[];
	searchTerm: string;
	zoomLevel: number;
	viewMode: 'month' | 'week';
	selectedDate: string | null; // 'YYYY-MM-DD'形式、モバイル用選択日
};

export const ScheduleProvider = ({
	children,
	schedules,
	eventTypes,
	eventCity,
	initialZoom = 100,
	initialViewMode = 'month',
}: React.PropsWithChildren<
	Pick<ScheduleContext, 'eventTypes' | 'schedules' | 'eventCity'> & {
		initialZoom?: number;
		initialViewMode?: 'month' | 'week';
	}
>) => {
	const [values, setValues] = useState<Fields>(() => ({
		isOnlyApplied: false,
		selectedTypes: eventTypes.map((d) => d.id),
		selectedCities: eventCity,
		selectedFormat: ['offline', 'online'],
		searchTerm: '',
		zoomLevel: initialZoom,
		viewMode: initialViewMode,
		selectedDate: null,
	}));

	const setFieldByKey = <TKey extends keyof Fields>(
		key: TKey,
		value: Fields[TKey],
	) => setValues((v) => ({ ...v, [key]: value }));

	return (
		<ScheduleContext.Provider
			value={{
				schedules,
				eventTypes,
				setFieldByKey,
				eventCity,
				fieldValues: values,
			}}
		>
			{children}
		</ScheduleContext.Provider>
	);
};

export const useSchedule = () => {
	const { schedules: original, fieldValues } = useScheduleContext();

	const schedules = useMemo(() => {
		const {
			isOnlyApplied,
			selectedFormat,
			selectedTypes,
			selectedCities,
			searchTerm,
		} = fieldValues;
		const filtered = original.filter((d) => {
			if (!d.type) return false;

			// 検索語でフィルタリング
			if (
				searchTerm &&
				!d.name.toLowerCase().includes(searchTerm.toLowerCase())
			) {
				return false;
			}

			const format = d.isOnline ? 'online' : 'offline';
			const isSelected =
				selectedFormat.includes(format) &&
				selectedTypes.includes(d.type.id) &&
				selectedCities.includes(d.city ?? '');

			return isOnlyApplied ? d.hasValidApplication && isSelected : isSelected;
		});

		return Map.groupBy(filtered, (event) => {
			return dayjs(event.startDatetime).format('YYYY-MM-DD');
		});
	}, [original, fieldValues]);

	return {
		schedules,
	};
};
