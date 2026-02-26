import { css } from '@/styled-system/css';
import { Search } from 'lucide-react';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '../ui/input';
import { styles } from '../ui/searchsectionstyles';
import { Select, SelectItem } from '../ui/select';
import { FilterSection } from './FilterSection';

interface AppliedFilters {
	applied: boolean;
	locations: { [key: string]: boolean };
	eventTypes: { [key: string]: boolean };
	format: { [key: string]: boolean };
}

const SearchSection = ({
	onSearch,
}: {
	onSearch: (params: {
		searchTerm: string;
		sortOption: string;
		appliedFilters: AppliedFilters;
	}) => void;
}) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [sortOption, setSortOption] = useState('date');
	const [filterState, setFilterState] = useState({
		eventType: false,
		format: false,
		location: false,
		applied: false,
	});
	const [appliedFilters, setAppliedFilters] = useState({
		applied: false,
		locations: {
			tokyo: false,
			osaka: false,
			fukuoka: false,
			sendai: false,
			nagoya: false,
			online: false,
		},
		eventTypes: {
			regular: false, // 定例会
			pdcaMeeting: false, // PDCA実践会議
			groupConsultation: false, // 5大都市グループ相談会&交流会
			bookkeeping: false, // 簿記講座
			onlineSeminar: false, // オンラインセミナー
			specialSeminar: false, // 特別セミナー
		},
		format: {
			online: false, // オンライン
			offline: false, // オフライン
		},
		dateRange: {
			startDate: '',
			endDate: '',
		},
	});

	const eventTypeRef = useRef<HTMLDivElement>(null);
	const formatRef = useRef<HTMLDivElement>(null);
	const locationRef = useRef<HTMLDivElement>(null);
	const appliedRef = useRef<HTMLDivElement>(null);

	const filterRefs = useMemo(
		() => ({
			eventType: eventTypeRef,
			format: formatRef,
			location: locationRef,
			applied: appliedRef,
		}),
		[],
	);

	const handleLocationChange = (
		location: 'tokyo' | 'osaka' | 'fukuoka' | 'sendai' | 'nagoya' | 'online',
	) => {
		setAppliedFilters({
			...appliedFilters,
			locations: {
				...appliedFilters.locations,
				[location]: !appliedFilters.locations[location],
			},
		});
	};

	const handleEventTypeChange = (
		eventType:
			| 'regular'
			| 'pdcaMeeting'
			| 'groupConsultation'
			| 'bookkeeping'
			| 'onlineSeminar'
			| 'specialSeminar',
	) => {
		setAppliedFilters({
			...appliedFilters,
			eventTypes: {
				...appliedFilters.eventTypes,
				[eventType]: !appliedFilters.eventTypes[eventType],
			},
		});
	};

	const handleFormatChange = (format: 'online' | 'offline') => {
		setAppliedFilters({
			...appliedFilters,
			format: {
				...appliedFilters.format,
				[format]: !appliedFilters.format[format],
			},
		});
	};

	const handleFilterChange = (filter: 'applied') => {
		setAppliedFilters({
			...appliedFilters,
			[filter]: !appliedFilters[filter],
		});
	};

	const toggleFilterState = (
		filterType: 'eventType' | 'format' | 'location' | 'applied',
	) => {
		// 他のフィルターをすべて閉じ、選択されたフィルターのみ切り替える
		setFilterState({
			eventType: filterType === 'eventType' ? !filterState.eventType : false,
			format: filterType === 'format' ? !filterState.format : false,
			location: filterType === 'location' ? !filterState.location : false,
			applied: filterType === 'applied' ? !filterState.applied : false,
		});
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			// 各フィルターボタン外のクリックをチェック
			const isOutsideClick = Object.entries(filterRefs).every(([key, ref]) => {
				return ref.current && !ref.current.contains(event.target as Node);
			});

			if (isOutsideClick) {
				setFilterState({
					eventType: false,
					format: false,
					location: false,
					applied: false,
				});
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [filterRefs]);

	return (
		<div className={styles.searchContainer}>
			{/* 検索ワード */}
			<div className={styles.searchInputContainer}>
				<div className={styles.searchInputWrapper}>
					<Input
						type="text"
						className={styles.input}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="イベント名で検索"
					/>
				</div>
			</div>

			<div className={styles.bottomRow}>
				{/* ソート */}
				<div className={styles.sortContainer}>
					<Select
						value={sortOption}
						onChange={(e) => setSortOption(e.target.value)}
						className={css({
							width: '180px',
							bg: 'white',
							border: '1px solid',
							borderColor: 'gray.200',
							rounded: 'md',
							_focus: {
								borderColor: 'green.500',
								boxShadow: '0 0 0 1px green.500',
							},
							'@media (max-width: 768px)': {
								width: '100%',
							},
						})}
					>
						<SelectItem value="date">開催日順（降順）</SelectItem>
						<SelectItem value="date_asc">開催日順（昇順）</SelectItem>
						<SelectItem value="participants">参加人数順</SelectItem>
						<SelectItem value="capacity">定員数順</SelectItem>
					</Select>
				</div>

				{/* フィルタボタン - 2行2列のグリッドレイアウト */}
				<div
					className={css({
						display: 'flex',
						gap: '2',
						'@media (max-width: 768px)': {
							display: 'grid',
							width: '100%',
							gridTemplateColumns: '1fr 1fr',
							gap: '2',
						},
					})}
				>
					{/* フィルターをグリッドで配置するための新しい構造 */}
					<FilterSection
						filterRefs={filterRefs}
						filterState={filterState}
						toggleFilterState={toggleFilterState}
						appliedFilters={appliedFilters}
						handleFilterChange={handleFilterChange}
						handleLocationChange={handleLocationChange}
						handleEventTypeChange={handleEventTypeChange}
						handleFormatChange={handleFormatChange}
					/>
				</div>

				<button
					type="button"
					className={styles.searchButton}
					onClick={() => onSearch({ searchTerm, sortOption, appliedFilters })}
				>
					<Search size={16} />
					検索
				</button>
			</div>
		</div>
	);
};

export default SearchSection;
