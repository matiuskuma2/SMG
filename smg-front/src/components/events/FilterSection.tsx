import {
	EVENT_TYPES,
	EVENT_TYPE_LABELS,
	type EventType,
	FORMATS,
	FORMAT_LABELS,
	type Format,
	LOCATIONS,
	LOCATION_LABELS,
	type Location,
} from '@/constants/filterConstants';
import { css } from '@/styled-system/css';
import {
	Bookmark,
	Calendar,
	ChevronDown,
	Filter,
	MapPin,
	Wifi,
} from 'lucide-react';
import type React from 'react';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { styles } from '../ui/searchsectionstyles';

interface FilterSectionProps {
	filterRefs: {
		eventType: React.RefObject<HTMLDivElement>;
		format: React.RefObject<HTMLDivElement>;
		location: React.RefObject<HTMLDivElement>;
		applied: React.RefObject<HTMLDivElement>;
	};
	filterState: {
		eventType: boolean;
		format: boolean;
		location: boolean;
		applied: boolean;
	};
	toggleFilterState: (
		filterType: 'eventType' | 'format' | 'location' | 'applied',
	) => void;
	appliedFilters: {
		applied: boolean;
		locations: Record<Location, boolean>;
		eventTypes: Record<EventType, boolean>;
		format: Record<Format, boolean>;
	};
	handleFilterChange: (filter: 'applied') => void;
	handleLocationChange: (location: Location) => void;
	handleEventTypeChange: (eventType: EventType) => void;
	handleFormatChange: (format: Format) => void;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
	filterRefs,
	filterState,
	toggleFilterState,
	appliedFilters,
	handleFilterChange,
	handleLocationChange,
	handleEventTypeChange,
	handleFormatChange,
}) => {
	console.log('FilterSection rendered, LOCATIONS:', LOCATIONS);
	console.log('FilterSection rendered, LOCATION_LABELS:', LOCATION_LABELS);
	// フィルタボタンの共通スタイル
	const filterButtonStyle = css({
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		px: '3',
		py: '2',
		rounded: 'md',
		border: '1px solid',
		borderColor: 'gray.200',
		bg: 'white',
		cursor: 'pointer',
		_hover: { bg: 'gray.50' },
		gap: '2',
		'@media (max-width: 768px)': {
			width: '100%',
		},
	});

	// フィルタポップオーバーの共通スタイル
	const popoverStyle = css({
		position: 'absolute',
		top: '100%',
		left: '0',
		zIndex: '10',
		mt: '2',
		width: '240px',
		'@media (max-width: 768px)': {
			width: '100%',
			maxHeight: '300px',
			overflowY: 'auto',
			position: 'absolute',
			left: '0',
			right: '0',
		},
	});

	// モバイル表示時の各フィルターのベーススタイル
	const filterBaseStyle = css({
		position: 'relative',
		'@media (max-width: 768px)': {
			width: '100%',
		},
	});

	return (
		<>
			{/* 開催区分フィルタ - グリッド配置の1列目 */}
			<div ref={filterRefs.eventType} className={filterBaseStyle}>
				<div
					className={filterButtonStyle}
					onClick={() => toggleFilterState('eventType')}
				>
					<div
						className={css({
							display: 'flex',
							alignItems: 'center',
							gap: '2',
						})}
					>
						<Calendar size={16} />
						<span>イベント種類</span>
					</div>
					<ChevronDown
						size={16}
						className={css({
							transform: filterState.eventType ? 'rotate(180deg)' : 'none',
							transition: 'transform 0.2s ease-in-out',
						})}
					/>
				</div>

				{filterState.eventType && (
					<div className={popoverStyle}>
						<div className={styles.popoverContent}>
							<div className={styles.filterSection}>
								<div
									className={css({
										display: 'flex',
										flexDirection: 'column',
										gap: '1',
									})}
								>
									{Object.entries(EVENT_TYPES).map(([key, value]) => (
										<div key={value} className={styles.filterItem}>
											<Checkbox
												id={value}
												checked={appliedFilters.eventTypes[value]}
												onChange={() => handleEventTypeChange(value)}
											/>
											<Label
												htmlFor={value}
												className={css({ cursor: 'pointer', flex: '1' })}
											>
												{EVENT_TYPE_LABELS[value]}
											</Label>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* オンライン/オフラインフィルタ - グリッド配置の2列目 */}
			<div ref={filterRefs.format} className={filterBaseStyle}>
				<div
					className={filterButtonStyle}
					onClick={() => toggleFilterState('format')}
				>
					<div
						className={css({
							display: 'flex',
							alignItems: 'center',
							gap: '2',
						})}
					>
						<Wifi size={16} />
						<span>開催形式</span>
					</div>
					<ChevronDown
						size={16}
						className={css({
							transform: filterState.format ? 'rotate(180deg)' : 'none',
							transition: 'transform 0.2s ease-in-out',
						})}
					/>
				</div>

				{filterState.format && (
					<div className={popoverStyle}>
						<div className={styles.popoverContent}>
							<div className={styles.filterSection}>
								<div
									className={css({
										display: 'flex',
										flexDirection: 'column',
										gap: '1',
									})}
								>
									{Object.entries(FORMATS).map(([key, value]) => (
										<div key={value} className={styles.filterItem}>
											<Checkbox
												id={value}
												checked={appliedFilters.format[value]}
												onChange={() => handleFormatChange(value)}
											/>
											<Label
												htmlFor={value}
												className={css({ cursor: 'pointer', flex: '1' })}
											>
												{FORMAT_LABELS[value]}
											</Label>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* 地域フィルタ - グリッド配置の3列目（2行目の左） */}
			<div ref={filterRefs.location} className={filterBaseStyle}>
				<div
					className={filterButtonStyle}
					onClick={() => toggleFilterState('location')}
				>
					<div
						className={css({
							display: 'flex',
							alignItems: 'center',
							gap: '2',
						})}
					>
						<MapPin size={16} />
						<span>地域</span>
					</div>
					<ChevronDown
						size={16}
						className={css({
							transform: filterState.location ? 'rotate(180deg)' : 'none',
							transition: 'transform 0.2s ease-in-out',
						})}
					/>
				</div>

				{filterState.location && (
					<div className={popoverStyle}>
						<div className={styles.popoverContent}>
							<div className={styles.filterSection}>
								<div
									className={css({
										display: 'flex',
										flexDirection: 'column',
										gap: '1',
									})}
								>
									{Object.entries(LOCATIONS).map(([key, value]) => (
										<div key={value} className={styles.filterItem}>
											<Checkbox
												id={value}
												checked={appliedFilters.locations[value]}
												onChange={() => handleLocationChange(value)}
											/>
											<Label
												htmlFor={value}
												className={css({ cursor: 'pointer', flex: '1' })}
											>
												{LOCATION_LABELS[value]}
											</Label>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* 申込済フィルタ - グリッド配置の4列目（2行目の右） */}
			<div ref={filterRefs.applied} className={filterBaseStyle}>
				<div
					className={filterButtonStyle}
					onClick={() => toggleFilterState('applied')}
				>
					<div
						className={css({
							display: 'flex',
							alignItems: 'center',
							gap: '2',
						})}
					>
						<Bookmark size={16} />
						<span>申込状況</span>
					</div>
					<ChevronDown
						size={16}
						className={css({
							transform: filterState.applied ? 'rotate(180deg)' : 'none',
							transition: 'transform 0.2s ease-in-out',
						})}
					/>
				</div>

				{filterState.applied && (
					<div className={popoverStyle}>
						<div className={styles.popoverContent}>
							<div className={styles.filterSection}>
								<div
									className={css({
										display: 'flex',
										flexDirection: 'column',
										gap: '1',
									})}
								>
									<div className={styles.filterItem}>
										<Checkbox
											id="applied"
											checked={appliedFilters.applied}
											onChange={() => handleFilterChange('applied')}
										/>
										<Label
											htmlFor="applied"
											className={css({ cursor: 'pointer', flex: '1' })}
										>
											申し込み済
										</Label>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	);
};
