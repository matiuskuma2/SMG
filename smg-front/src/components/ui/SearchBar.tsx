import type { Format, Location } from '@/constants/filterConstants';
import { css } from '@/styled-system/css';
import { Tooltip } from '@ark-ui/react';
import Link from 'next/link';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { LuCalendar } from 'react-icons/lu';
import { FilterSection, type EventTypeOption } from './FilterSection';
import { Input } from './input';
import { styles } from './searchsectionstyles';
import { Select, SelectItem } from './select';

interface SearchBarProps {
	onSearch: (params: {
		searchTerm: string;
		sortOption: string;
		appliedFilters: {
			applied: boolean;
			locations: {
				tokyo: boolean;
				osaka: boolean;
				fukuoka: boolean;
				sendai: boolean;
				nagoya: boolean;
				online: boolean;
			};
			eventTypes: Record<string, boolean>;
			format: {
				online: boolean;
				offline: boolean;
			};
		};
	}) => void;
	sortOptions?: {
		value: string;
		label: string;
	}[];
	placeholderText?: string;
	disabledFilters?: {
		eventType?: boolean;
		format?: boolean;
		location?: boolean;
		applied?: boolean;
	};
	currentFilterParams?: {
		searchTerm: string;
		sortOption: string;
		appliedFilters: {
			applied: boolean;
			locations: {
				tokyo: boolean;
				osaka: boolean;
				fukuoka: boolean;
				sendai: boolean;
				nagoya: boolean;
				online: boolean;
			};
			eventTypes: Record<string, boolean>;
			format: {
				online: boolean;
				offline: boolean;
			};
		};
	};
	eventTypeOptions?: EventTypeOption[];
}

const defaultSortOptions = [
	{ value: 'date', label: '開催日順（降順）' },
	{ value: 'date_asc', label: '開催日順（昇順）' },
	{ value: 'participants_asc', label: '参加人数順（昇順）' },
	{ value: 'participants', label: '参加人数順（降順）' },
	{ value: 'capacity_asc', label: '定員数順（昇順）' },
	{ value: 'capacity', label: '定員数順（降順）' },
];

const SearchBar: React.FC<SearchBarProps> = ({
	onSearch,
	sortOptions = defaultSortOptions,
	placeholderText = 'イベント名で検索',
	disabledFilters = {},
	currentFilterParams,
	eventTypeOptions = [],
}) => {
	const [searchTerm, setSearchTerm] = useState(
		currentFilterParams?.searchTerm || '',
	);
	const [sortOption, setSortOption] = useState(
		currentFilterParams?.sortOption || 'date',
	);
	const [filterState, setFilterState] = useState({
		eventType: false,
		format: false,
		location: false,
		applied: false,
	});
	const [appliedFilters, setAppliedFilters] = useState(
		currentFilterParams?.appliedFilters || {
			applied: false,
			locations: {
				tokyo: false,
				osaka: false,
				fukuoka: false,
				sendai: false,
				nagoya: false,
				online: false,
			},
			eventTypes: {} as Record<string, boolean>,
			format: {
				online: false, // オンライン
				offline: false, // オフライン
			},
		},
	);

	const eventTypeRef = useRef<HTMLDivElement>(null);
	const formatRef = useRef<HTMLDivElement>(null);
	const locationRef = useRef<HTMLDivElement>(null);
	const appliedRef = useRef<HTMLDivElement>(null);

	const filterRefs = {
		eventType: eventTypeRef,
		format: formatRef,
		location: locationRef,
		applied: appliedRef,
	};

	const handleLocationChange = (location: Location) => {
		setAppliedFilters({
			...appliedFilters,
			locations: {
				...appliedFilters.locations,
				[location]: !appliedFilters.locations[location],
			},
		});
	};

	const handleEventTypeChange = (eventTypeId: string) => {
		setAppliedFilters({
			...appliedFilters,
			eventTypes: {
				...appliedFilters.eventTypes,
				[eventTypeId]: !appliedFilters.eventTypes[eventTypeId],
			},
		});
	};

	const handleFormatChange = (format: Format) => {
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

	// currentFilterParamsが変更されたときに状態を更新
	useEffect(() => {
		if (currentFilterParams) {
			setSearchTerm(currentFilterParams.searchTerm);
			setSortOption(currentFilterParams.sortOption);
			setAppliedFilters(currentFilterParams.appliedFilters);
		}
	}, [currentFilterParams]);

	// ソートオプションが変更されたときに自動的に検索を実行
	const prevSortOption = useRef(currentFilterParams?.sortOption || 'date');
	useEffect(() => {
		if (sortOption !== prevSortOption.current) {
			prevSortOption.current = sortOption;
			onSearch({ searchTerm, sortOption, appliedFilters });
		}
	}, [sortOption, searchTerm, appliedFilters, onSearch]);

	// フィルターが変更されたときに自動的に検索を実行
	const prevAppliedFilters = useRef(currentFilterParams?.appliedFilters);
	useEffect(() => {
		const prev = prevAppliedFilters.current;
		if (prev && JSON.stringify(appliedFilters) !== JSON.stringify(prev)) {
			prevAppliedFilters.current = appliedFilters;
			onSearch({ searchTerm, sortOption, appliedFilters });
		}
	}, [appliedFilters, searchTerm, sortOption, onSearch]);

	// Enterキーで検索実行
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			onSearch({ searchTerm, sortOption, appliedFilters });
		}
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			// 各フィルターボタン外のクリックをチェック
			const isOutsideClick = [
				eventTypeRef,
				formatRef,
				locationRef,
				appliedRef,
			].every((ref) => {
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
	}, []);

	const handleSearchClick = () => {
		onSearch({ searchTerm, sortOption, appliedFilters });
	};

	return (
		<div className={styles.searchContainer}>
			{/* 検索ワード */}
			<div className={styles.searchInputContainer}>
				<div
					className={css({
						display: 'flex',
						gap: '2',
						alignItems: 'center',
					})}
				>
					<Input
						type="text"
						className={styles.input}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={placeholderText}
					/>
					<button
						type="button"
						onClick={handleSearchClick}
						className={css({
							px: '6',
							py: '2',
							bg: '#BF0000',
							color: 'white',
							borderRadius: 'md',
							fontWeight: 'medium',
							fontSize: 'sm',
							cursor: 'pointer',
							transition: 'background-color 0.2s',
							whiteSpace: 'nowrap',
							_hover: {
								bg: '#A00000',
							},
							_active: {
								bg: '#800000',
							},
						})}
					>
						検索
					</button>
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
						{sortOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
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
						disabledFilters={disabledFilters}
						eventTypeOptions={eventTypeOptions}
					/>
				</div>

				<Tooltip.Root positioning={{ placement: 'bottom' }}>
					<Tooltip.Trigger>
						<Link
							href={'/events/schedule'}
							className={css({
								d: 'grid',
								placeItems: 'center',
								p: 2,
								rounded: 'md',
								border: '1px solid',
								borderColor: 'gray.200',
							})}
						>
							<LuCalendar size={24} />
						</Link>
					</Tooltip.Trigger>
					<Tooltip.Positioner>
						<Tooltip.Content
							className={css({
								rounded: 'md',
								bg: 'white',
								border: '1px solid',
								borderColor: 'gray.200',
								p: 2,
								zIndex: 50,
							})}
						>
							カレンダー表示へ
						</Tooltip.Content>
					</Tooltip.Positioner>
				</Tooltip.Root>
			</div>
		</div>
	);
};

export default SearchBar;
