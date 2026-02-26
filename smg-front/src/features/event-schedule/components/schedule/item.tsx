import { css, cva } from '@/styled-system/css';
import { Checkbox, Portal, Select, createListCollection } from '@ark-ui/react';
import Link from 'next/link';
import {
	LuCalendar,
	LuCalendarDays,
	LuCheck,
	LuChevronDown,
	LuMapPin,
	LuMinus,
	LuMonitor,
	LuPlus,
	LuTag,
} from 'react-icons/lu';
import type { Schedule } from '../../action/schedule';
import { useScheduleContext } from '../../hooks/use-schedule';

type Items = { label: string; value: string };

export const FormatSelector = () => {
	const { fieldValues, setFieldByKey } = useScheduleContext();
	const collection = createListCollection<Items>({
		items: [
			{ label: 'オフライン', value: 'offline' },
			{ label: 'オンライン', value: 'online' },
		],
	});

	return (
		<Select.Root
			collection={collection}
			multiple
			value={fieldValues.selectedFormat}
			onValueChange={(d) => setFieldByKey('selectedFormat', d.value)}
		>
			<Select.Trigger className={filterButtonStyle}>
				<LuMonitor />
				開催形式
				<Select.Indicator>
					<LuChevronDown />
				</Select.Indicator>
			</Select.Trigger>
			<Portal>
				<Select.Positioner>
					<Select.Content className={dropdownStyle}>
						{collection.items.map((item) => (
							<Select.Item
								key={item.value}
								item={item}
								className={checkboxItemStyle}
							>
								<Select.ItemIndicator>
									<LuCheck />
								</Select.ItemIndicator>
								<Select.ItemText>{item.label}</Select.ItemText>
							</Select.Item>
						))}
					</Select.Content>
				</Select.Positioner>
			</Portal>
			<Select.HiddenSelect />
		</Select.Root>
	);
};

export const EventTypeSelector = () => {
	const { fieldValues, setFieldByKey, eventTypes } = useScheduleContext();
	const collection = createListCollection<Items>({
		items: eventTypes.map((d) => ({ label: d.name, value: d.id })),
	});

	return (
		<Select.Root
			collection={collection}
			multiple
			value={fieldValues.selectedTypes}
			onValueChange={(d) => setFieldByKey('selectedTypes', d.value)}
		>
			<Select.Trigger className={filterButtonStyle}>
				<LuTag />
				イベント種類
				<Select.Indicator>
					<LuChevronDown />
				</Select.Indicator>
			</Select.Trigger>
			<Portal>
				<Select.Positioner>
					<Select.Content className={dropdownStyle}>
						{collection.items.map((item) => (
							<Select.Item
								key={item.value}
								item={item}
								className={checkboxItemStyle}
							>
								<Select.ItemIndicator>
									<LuCheck />
								</Select.ItemIndicator>
								<Select.ItemText>{item.label}</Select.ItemText>
							</Select.Item>
						))}
					</Select.Content>
				</Select.Positioner>
			</Portal>
			<Select.HiddenSelect />
		</Select.Root>
	);
};

export const EventCitySelector = () => {
	const { fieldValues, setFieldByKey, eventCity } = useScheduleContext();
	const collection = createListCollection({
		items: eventCity,
	});

	return (
		<Select.Root
			collection={collection}
			multiple
			value={fieldValues.selectedCities}
			onValueChange={(d) => setFieldByKey('selectedCities', d.value)}
		>
			<Select.Trigger className={filterButtonStyle}>
				<LuMapPin />
				開催地
				<Select.Indicator>
					<LuChevronDown />
				</Select.Indicator>
			</Select.Trigger>
			<Portal>
				<Select.Positioner>
					<Select.Content className={dropdownStyle}>
						{collection.items.map((item) => (
							<Select.Item key={item} item={item} className={checkboxItemStyle}>
								<Select.ItemIndicator>
									<LuCheck />
								</Select.ItemIndicator>
								<Select.ItemText>{item}</Select.ItemText>
							</Select.Item>
						))}
					</Select.Content>
				</Select.Positioner>
			</Portal>
			<Select.HiddenSelect />
		</Select.Root>
	);
};

export const AppliedToggle = () => {
	const { fieldValues, setFieldByKey } = useScheduleContext();
	return (
		<Checkbox.Root
			className={filterButtonStyle}
			checked={fieldValues.isOnlyApplied}
			onCheckedChange={(v) => setFieldByKey('isOnlyApplied', !!v.checked)}
		>
			<Checkbox.Control>
				<Checkbox.Indicator>
					<LuCheck />
				</Checkbox.Indicator>
			</Checkbox.Control>
			<Checkbox.Label className={css({ pr: '1' })}>申込済み</Checkbox.Label>
			<Checkbox.HiddenInput />
		</Checkbox.Root>
	);
};

export const ZoomControl = () => {
	const { fieldValues, setFieldByKey } = useScheduleContext();
	const { zoomLevel } = fieldValues;

	const updateZoomInUrl = (newZoom: number) => {
		const params = new URLSearchParams(window.location.search);
		params.set('zoom', newZoom.toString());
		window.history.replaceState(null, '', `?${params.toString()}`);
	};

	const zoomIn = () => {
		if (zoomLevel < 150) {
			const newZoom = zoomLevel + 10;
			setFieldByKey('zoomLevel', newZoom);
			updateZoomInUrl(newZoom);
		}
	};

	const zoomOut = () => {
		if (zoomLevel > 70) {
			const newZoom = zoomLevel - 10;
			setFieldByKey('zoomLevel', newZoom);
			updateZoomInUrl(newZoom);
		}
	};

	const resetZoom = () => {
		setFieldByKey('zoomLevel', 100);
		updateZoomInUrl(100);
	};

	return (
		<div
			className={css({
				display: 'flex',
				alignItems: 'center',
				gap: '2',
				px: '3',
				py: '2',
				bg: 'white',
				border: '1px solid',
				borderColor: 'gray.200',
				rounded: 'md',
				fontSize: 'sm',
			})}
		>
			<button
				type="button"
				onClick={zoomOut}
				disabled={zoomLevel <= 70}
				className={css({
					display: 'flex',
					alignItems: 'center',
					cursor: 'pointer',
					color: 'gray.700',
					opacity: { base: 1, _disabled: 0.4 },
					_hover: {
						color: { base: 'blue.600', _disabled: 'gray.700' },
					},
				})}
				aria-label="縮小"
			>
				<LuMinus />
			</button>
			<span
				onClick={resetZoom}
				className={css({
					minW: '12',
					textAlign: 'center',
					cursor: 'pointer',
					color: 'gray.700',
					fontWeight: 'medium',
					_hover: {
						color: 'blue.600',
					},
				})}
				title="クリックで100%に戻す"
			>
				{zoomLevel}%
			</span>
			<button
				type="button"
				onClick={zoomIn}
				disabled={zoomLevel >= 150}
				className={css({
					display: 'flex',
					alignItems: 'center',
					cursor: 'pointer',
					color: 'gray.700',
					opacity: { base: 1, _disabled: 0.4 },
					_hover: {
						color: { base: 'blue.600', _disabled: 'gray.700' },
					},
				})}
				aria-label="拡大"
			>
				<LuPlus />
			</button>
		</div>
	);
};

export const ViewModeToggle = () => {
	const { fieldValues, setFieldByKey } = useScheduleContext();
	const { viewMode } = fieldValues;

	return (
		<div
			className={css({
				display: 'inline-flex',
				alignItems: 'center',
				bg: 'gray.100',
				rounded: 'md',
				p: '1',
				gap: '1',
			})}
		>
			<button
				type="button"
				onClick={() => setFieldByKey('viewMode', 'month')}
				className={css({
					display: 'inline-flex',
					alignItems: 'center',
					gap: '2',
					px: '3',
					py: '1.5',
					rounded: 'md',
					fontSize: 'sm',
					cursor: 'pointer',
					bg: viewMode === 'month' ? 'white' : 'transparent',
					color: viewMode === 'month' ? 'gray.900' : 'gray.600',
					shadow: viewMode === 'month' ? 'sm' : 'none',
					fontWeight: viewMode === 'month' ? 'medium' : 'normal',
					whiteSpace: 'nowrap',
					_hover: {
						color: 'gray.900',
					},
				})}
			>
				<LuCalendar size={16} />
				<span>月</span>
			</button>
			<button
				type="button"
				onClick={() => setFieldByKey('viewMode', 'week')}
				className={css({
					display: 'inline-flex',
					alignItems: 'center',
					gap: '2',
					px: '3',
					py: '1.5',
					rounded: 'md',
					fontSize: 'sm',
					cursor: 'pointer',
					bg: viewMode === 'week' ? 'white' : 'transparent',
					color: viewMode === 'week' ? 'gray.900' : 'gray.600',
					shadow: viewMode === 'week' ? 'sm' : 'none',
					fontWeight: viewMode === 'week' ? 'medium' : 'normal',
					whiteSpace: 'nowrap',
					_hover: {
						color: 'gray.900',
					},
				})}
			>
				<LuCalendarDays size={16} />
				<span>週</span>
			</button>
		</div>
	);
};

export const ScheduleLabel = ({ schedule }: { schedule: Schedule }) => (
	<Link
		href={`/events/${schedule.id}`}
		className={scheduleLabelStyle({
			type: schedule.type.name as keyof typeof typeVariants,
		})}
		onClick={(e) => e.stopPropagation()}
	>
		{schedule.name}
	</Link>
);

const filterButtonStyle = css({
	display: 'flex',
	alignItems: 'center',
	gap: '2',
	px: '3',
	py: '2',
	bg: 'white',
	color: 'gray.700',
	border: '1px solid',
	borderColor: 'gray.200',
	rounded: 'md',
	fontSize: 'sm',
	_hover: {
		bg: 'gray.50',
	},
	'@media (max-width: 768px)': {
		width: '100%',
	},
});

const dropdownStyle = css({
	bg: 'white',
	border: '1px solid',
	borderColor: 'gray.200',
	rounded: 'md',
	shadow: 'md',
	p: '2',
	w: 'var(--select-trigger-width)',
	'@media (max-width: 768px)': {
		left: '0',
		right: '0',
		width: 'calc(100% - 1rem)',
	},
});

const checkboxItemStyle = css({
	display: 'flex',
	alignItems: 'center',
	gap: '2',
	px: '3',
	py: '2',
	rounded: 'md',
	cursor: 'pointer',
	bg: {
		_checked: 'green.50',
		base: 'white',
	},
	color: {
		_checked: 'green.700',
		base: 'gray.700',
	},
	_hover: {
		bg: {
			_checked: 'green.100',
			base: 'gray.50',
		},
	},
});

// TODO: DBの中身を知らなくてもよい方法へ修正
// DBの値次第では色の割り当てがされない
export const typeVariants = {
	default: {
		bg: '#EDF2F7',
		color: '#4A5568',
	},
	定例会: {
		bg: '#BEE3F8',
		color: '#2B6CB0',
	},
	PDCA会議実践講座: {
		bg: '#C6F6D5',
		color: '#276749',
	},
	'5大都市グループ相談会&交流会': {
		bg: '#E9D8FD',
		color: '#553C9A',
	},
	簿記講座: {
		bg: '#FEEBC8',
		color: '#C05621',
	},
	オンラインセミナー: {
		bg: '#B2F5EA',
		color: '#285E61',
	},
	特別セミナー: {
		bg: '#FED7D7',
		color: '#C53030',
	},
};

const scheduleLabelStyle = cva({
	base: {
		display: 'block',
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		rounded: 'sm',
		paddingInline: '0.5',
		mb: '0.5',
	},
	variants: {
		type: typeVariants,
	},
	defaultVariants: {
		type: 'default',
	},
});
