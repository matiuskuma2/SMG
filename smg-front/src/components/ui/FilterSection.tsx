import {
	FORMATS,
	FORMAT_LABELS,
	type Format,
	LOCATIONS,
	LOCATION_LABELS,
	type Location,
} from '@/constants/filterConstants';
import { css } from '@/styled-system/css';
import { Check, ChevronDown, MapPin, Monitor, Tag, User } from 'lucide-react';
import type React from 'react';

export interface EventTypeOption {
	id: string;
	name: string;
}

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
		eventTypes: Record<string, boolean>;
		format: Record<Format, boolean>;
	};
	handleFilterChange: (filter: 'applied') => void;
	handleLocationChange: (location: Location) => void;
	handleEventTypeChange: (eventTypeId: string) => void;
	handleFormatChange: (format: Format) => void;
	disabledFilters?: {
		eventType?: boolean;
		format?: boolean;
		location?: boolean;
		applied?: boolean;
	};
	eventTypeOptions?: EventTypeOption[];
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
	disabledFilters = {},
	eventTypeOptions = [],
}) => {
	const filterButtonStyle = (isActive: boolean) =>
		css({
			display: 'flex',
			alignItems: 'center',
			gap: '2',
			px: '3',
			py: '2',
			bg: isActive ? 'green.100' : 'white',
			color: isActive ? 'green.700' : 'gray.700',
			border: '1px solid',
			borderColor: isActive ? 'green.500' : 'gray.200',
			rounded: 'md',
			fontSize: 'sm',
			cursor: 'pointer',
			whiteSpace: 'nowrap',
			_hover: {
				bg: isActive ? 'green.100' : 'gray.50',
			},
			'@media (max-width: 768px)': {
				width: '100%',
			},
		});

	const dropdownStyle = css({
		position: 'absolute',
		mt: '1',
		zIndex: '10',
		bg: 'white',
		border: '1px solid',
		borderColor: 'gray.200',
		rounded: 'md',
		shadow: 'md',
		p: '2',
		minWidth: '220px',
		'@media (max-width: 768px)': {
			left: '0',
			right: '0',
			width: 'calc(100% - 1rem)',
		},
	});

	const checkboxItemStyle = (isChecked: boolean) =>
		css({
			display: 'flex',
			alignItems: 'center',
			gap: '2',
			px: '3',
			py: '2',
			rounded: 'md',
			cursor: 'pointer',
			bg: isChecked ? 'green.50' : 'white',
			color: isChecked ? 'green.700' : 'gray.700',
			whiteSpace: 'nowrap',
			_hover: {
				bg: isChecked ? 'green.100' : 'gray.50',
			},
		});

	return (
		<>
			{/* 開催区分フィルター */}
			{!disabledFilters.eventType && (
				<div
					ref={filterRefs.eventType}
					className={css({ position: 'relative' })}
				>
					<button
						type="button"
						className={filterButtonStyle(
							Object.values(appliedFilters.eventTypes).some((v) => v),
						)}
						onClick={() => toggleFilterState('eventType')}
					>
						<Tag size={16} />
						イベント種類
						<ChevronDown size={16} />
					</button>
					{filterState.eventType && (
						<div className={dropdownStyle}>
							{eventTypeOptions.map((eventType) => (
								<button
									key={eventType.id}
									type="button"
									className={checkboxItemStyle(appliedFilters.eventTypes[eventType.id] || false)}
									onClick={() => handleEventTypeChange(eventType.id)}
								>
									{appliedFilters.eventTypes[eventType.id] && <Check size={16} />}
									<span>{eventType.name}</span>
								</button>
							))}
						</div>
					)}
				</div>
			)}

			{/* 開催形式フィルター */}
			{!disabledFilters.format && (
				<div ref={filterRefs.format} className={css({ position: 'relative' })}>
					<button
						type="button"
						className={filterButtonStyle(
							Object.values(appliedFilters.format).some((v) => v),
						)}
						onClick={() => toggleFilterState('format')}
					>
						<Monitor size={16} />
						開催形式
						<ChevronDown size={16} />
					</button>
					{filterState.format && (
						<div className={dropdownStyle}>
							{Object.entries(FORMATS).map(([key, value]) => (
								<button
									key={value}
									type="button"
									className={checkboxItemStyle(appliedFilters.format[value])}
									onClick={() => handleFormatChange(value)}
								>
									{appliedFilters.format[value] && <Check size={16} />}
									<span>{FORMAT_LABELS[value]}</span>
								</button>
							))}
						</div>
					)}
				</div>
			)}

			{/* 開催地フィルター */}
			{!disabledFilters.location && (
				<div
					ref={filterRefs.location}
					className={css({ position: 'relative' })}
				>
					<button
						type="button"
						className={filterButtonStyle(
							Object.values(appliedFilters.locations).some((v) => v),
						)}
						onClick={() => toggleFilterState('location')}
					>
						<MapPin size={16} />
						開催地
						<ChevronDown size={16} />
					</button>
					{filterState.location && (
						<div className={dropdownStyle}>
							{Object.entries(LOCATIONS).map(([key, value]) => (
								<button
									key={value}
									type="button"
									className={checkboxItemStyle(appliedFilters.locations[value])}
									onClick={() => handleLocationChange(value)}
								>
									{appliedFilters.locations[value] && <Check size={16} />}
									<span>{LOCATION_LABELS[value]}</span>
								</button>
							))}
						</div>
					)}
				</div>
			)}

			{/* 申込済みフィルター */}
			{!disabledFilters.applied && (
				<div ref={filterRefs.applied} className={css({ position: 'relative' })}>
					<button
						type="button"
						className={filterButtonStyle(appliedFilters.applied)}
						onClick={() => toggleFilterState('applied')}
					>
						<User size={16} />
						申込済み
						<ChevronDown size={16} />
					</button>
					{filterState.applied && (
						<div className={dropdownStyle}>
							<button
								type="button"
								className={checkboxItemStyle(appliedFilters.applied)}
								onClick={() => handleFilterChange('applied')}
							>
								{appliedFilters.applied && <Check size={16} />}
								<span>申込済みのみ表示</span>
							</button>
						</div>
					)}
				</div>
			)}
		</>
	);
};

export default FilterSection;
