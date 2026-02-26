'use client';

import type { Schedule } from '@/features/event-schedule/action/schedule';
import * as Calendar from '@/features/event-schedule/components/calender';
import dayjs from '@/lib/dayjs';
import { css } from '@/styled-system/css';
import { Divider, Flex, styled } from '@/styled-system/jsx';
import type { StyledVariantProps } from '@/styled-system/types';
import { Popover, Portal, ScrollArea } from '@ark-ui/react';
import { type CalendarDate, parseDate } from '@internationalized/date';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo } from 'react';
import { MdClose, MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import { Search } from 'lucide-react';
import { useSchedule } from '../../hooks/use-schedule';
import { useScheduleContext } from '../../hooks/use-schedule';
import { PUBLISH_LABEL, PUBLISH_STATUS } from '../../lib/event';
import {
	AppliedToggle,
	EventCitySelector,
	EventTypeSelector,
	FormatSelector,
	ScheduleLabel,
	ViewModeToggle,
	ZoomControl,
	typeVariants,
} from './item';
import { MobileFilterButton } from './mobile-filter';
import { MobileEventList } from './mobile-event-list';
import { WeekView } from './week-view';

export const ScheduleCalendar = ({
	defaultValue,
}: { defaultValue?: string }) => {
	const { schedules } = useSchedule();
	const { setFieldByKey, fieldValues } = useScheduleContext();

	const [date, setDate] = useState(
		parseDate(defaultValue ?? dayjs().format('YYYY-MM')),
	);
	const [calendarHeight, setCalendarHeight] = useState(0);
	const calendarRef = React.useRef<HTMLDivElement>(null);
	const router = useRouter();

	// URLパラメータを更新する関数
	const updateUrlParams = (newDate: CalendarDate, mode: 'month' | 'week') => {
		const params = new URLSearchParams(window.location.search);
		const d = dayjs(newDate.toString());

		if (mode === 'month') {
			params.set('month', d.format('YYYY-MM'));
			params.delete('week');
		} else {
			// 週の開始日（日曜日）を計算してセット
			const weekStartDate = d.subtract(d.day(), 'day');
			params.set('week', weekStartDate.format('YYYY-MM-DD'));
			params.delete('month');
		}

		router.push(`?${params.toString()}`, { scroll: false });
	};

	const onFocusChange = (date: CalendarDate) => {
		setDate(date);
		updateUrlParams(date, fieldValues.viewMode);
	};

	useEffect(() => {
		if (calendarRef.current) {
			const height = calendarRef.current.scrollHeight;
			setCalendarHeight(height);
		}
	}, [date, schedules]);

	// viewModeが変わった時にURLパラメータを更新
	useEffect(() => {
		updateUrlParams(date, fieldValues.viewMode);
	}, [fieldValues.viewMode]);

	const scaledHeight = calendarHeight * (fieldValues.zoomLevel / 100);

	// 週表示用：週の開始日（日曜日）を計算
	const weekStart = useMemo(() => {
		const d = dayjs(date.toString());
		return d.subtract(d.day(), 'day');
	}, [date]);

	// 週表示用：週の終了日（土曜日）を計算
	const weekEnd = useMemo(() => {
		return weekStart.add(6, 'day');
	}, [weekStart]);

	// 週ナビゲーション
	const goToPrevWeek = () => {
		const newDate = dayjs(date.toString()).subtract(7, 'day');
		const calendarDate = parseDate(newDate.format('YYYY-MM-DD'));
		onFocusChange(calendarDate);
	};

	const goToNextWeek = () => {
		const newDate = dayjs(date.toString()).add(7, 'day');
		const calendarDate = parseDate(newDate.format('YYYY-MM-DD'));
		onFocusChange(calendarDate);
	};

	// 週表示用のタイトル
	const weekTitle = useMemo(() => {
		return `${weekStart.format('M/D')} 〜 ${weekEnd.format('M/D')}`;
	}, [weekStart, weekEnd]);

	// 日表示用のタイトル（モバイル用）
	const dayTitle = useMemo(() => {
		const d = dayjs(date.toString());
		return `${d.format('M月D日')}(${d.format('dd')})`;
	}, [date]);

	// 日ナビゲーション（モバイル用）
	const goToPrevDay = () => {
		const newDate = dayjs(date.toString()).subtract(1, 'day');
		const calendarDate = parseDate(newDate.format('YYYY-MM-DD'));
		onFocusChange(calendarDate);
	};

	const goToNextDay = () => {
		const newDate = dayjs(date.toString()).add(1, 'day');
		const calendarDate = parseDate(newDate.format('YYYY-MM-DD'));
		onFocusChange(calendarDate);
	};

	// 日付選択ハンドラー（モバイル用）
	const handleDateSelect = (dateStr: string) => {
		setFieldByKey('selectedDate', dateStr);
	};

	return (
		<Calendar.Root focusedValue={date} onFocusChange={onFocusChange}>
			<div
				className={css({
					bg: 'white',
					pt: '4',
					px: '4',
					pb: { base: '2', md: '4' },
					roundedTop: 'md',
				})}
			>
				{/* 1行目: 月/週切り替え（デスクトップのみ） */}
				<div className={css({ display: { base: 'none', md: 'block' }, mb: '2' })}>
					<ViewModeToggle />
				</div>

				{/* 2行目: ナビゲーション + フィルター */}
				<Flex gap={4} flexWrap="wrap" alignItems="center" justifyContent={{ base: 'space-between', md: 'flex-start' }} w="full">
					{/* ナビゲーション */}
					<Flex gap={4} alignItems="center">
						{fieldValues.viewMode === 'month' ? (
							<>
								<Calendar.PrevButton />
								<Calendar.Title
									className={css({ fontWeight: 'medium', fontSize: 'lg' })}
								/>
								<Calendar.NextButton />
								{/* モバイル: 月/週切り替え */}
								<div
									className={css({
										display: { base: 'inline-flex', md: 'none' },
										alignItems: 'center',
										bg: 'gray.100',
										rounded: 'md',
										p: '0.5',
										gap: '0.5',
										ml: '2',
									})}
								>
									<button
										type="button"
										onClick={() => {}}
										className={css({
											px: '2',
											py: '1',
											rounded: 'sm',
											fontSize: 'xs',
											cursor: 'default',
											bg: 'white',
											color: 'gray.900',
											shadow: 'sm',
											fontWeight: 'medium',
										})}
									>
										月
									</button>
									<button
										type="button"
										onClick={() => setFieldByKey('viewMode', 'week')}
										className={css({
											px: '2',
											py: '1',
											rounded: 'sm',
											fontSize: 'xs',
											cursor: 'pointer',
											bg: 'transparent',
											color: 'gray.600',
											_hover: {
												color: 'gray.900',
											},
										})}
									>
										日
									</button>
								</div>
							</>
						) : (
							<>
								{/* デスクトップ: 週単位ナビゲーション */}
								<div className={css({ display: { base: 'none', md: 'flex' }, gap: '4', alignItems: 'center' })}>
									<button
										type="button"
										onClick={goToPrevWeek}
										className={css({
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											w: '8',
											h: '8',
											rounded: 'full',
											cursor: 'pointer',
											color: 'gray.600',
											_hover: {
												bg: 'gray.100',
											},
										})}
										aria-label="前の週"
									>
										<MdKeyboardArrowLeft size={24} />
									</button>
									<span className={css({ fontWeight: 'medium', fontSize: 'lg', textAlign: 'center', whiteSpace: 'nowrap' })}>
										{weekTitle}
									</span>
									<button
										type="button"
										onClick={goToNextWeek}
										className={css({
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											w: '8',
											h: '8',
											rounded: 'full',
											cursor: 'pointer',
											color: 'gray.600',
											_hover: {
												bg: 'gray.100',
											},
										})}
										aria-label="次の週"
									>
										<MdKeyboardArrowRight size={24} />
									</button>
								</div>
								{/* モバイル: 1日単位ナビゲーション + 週/日切り替え */}
								<div className={css({ display: { base: 'flex', md: 'none' }, gap: '3', alignItems: 'center' })}>
									<button
										type="button"
										onClick={goToPrevDay}
										className={css({
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											w: '8',
											h: '8',
											rounded: 'full',
											cursor: 'pointer',
											color: 'gray.600',
											_hover: {
												bg: 'gray.100',
											},
										})}
										aria-label="前の日"
									>
										<MdKeyboardArrowLeft size={24} />
									</button>
									<span className={css({ fontWeight: 'medium', fontSize: 'md', textAlign: 'center', whiteSpace: 'nowrap' })}>
										{dayTitle}
									</span>
									<button
										type="button"
										onClick={goToNextDay}
										className={css({
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											w: '8',
											h: '8',
											rounded: 'full',
											cursor: 'pointer',
											color: 'gray.600',
											_hover: {
												bg: 'gray.100',
											},
										})}
										aria-label="次の日"
									>
										<MdKeyboardArrowRight size={24} />
									</button>
									{/* 週/日切り替え */}
									<div
										className={css({
											display: 'inline-flex',
											alignItems: 'center',
											bg: 'gray.100',
											rounded: 'md',
											p: '0.5',
											gap: '0.5',
										})}
									>
										<button
											type="button"
											onClick={() => setFieldByKey('viewMode', 'month')}
											className={css({
												px: '2',
												py: '1',
												rounded: 'sm',
												fontSize: 'xs',
												cursor: 'pointer',
												bg: 'transparent',
												color: 'gray.600',
												_hover: {
													color: 'gray.900',
												},
											})}
										>
											月
										</button>
										<button
											type="button"
											onClick={() => {}}
											className={css({
												px: '2',
												py: '1',
												rounded: 'sm',
												fontSize: 'xs',
												cursor: 'default',
												bg: 'white',
												color: 'gray.900',
												shadow: 'sm',
												fontWeight: 'medium',
											})}
										>
											日
										</button>
									</div>
								</div>
							</>
						)}
					</Flex>

					{/* デスクトップ用フィルター */}
					<div
						className={css({
							display: { base: 'none', md: 'contents' },
						})}
					>
						{/* 検索フィールド */}
						<div
							className={css({
								position: 'relative',
								width: '180px',
							})}
						>
							<Search
								size={16}
								className={css({
									position: 'absolute',
									left: '3',
									top: '50%',
									transform: 'translateY(-50%)',
									color: 'gray.400',
									pointerEvents: 'none',
								})}
							/>
							<input
								type="text"
								placeholder="イベント名で検索"
								value={fieldValues.searchTerm}
								onChange={(e) => setFieldByKey('searchTerm', e.target.value)}
								className={css({
									w: 'full',
									pl: '9',
									pr: '3',
									py: '1.5',
									border: '1px solid',
									borderColor: 'gray.300',
									rounded: 'md',
									fontSize: 'sm',
									outline: 'none',
									_focus: {
										borderColor: 'blue.500',
										boxShadow: '0 0 0 1px blue.500',
									},
								})}
							/>
						</div>

						<EventCitySelector />
						<EventTypeSelector />
						<FormatSelector />
						<AppliedToggle />
						<ZoomControl />
					</div>

					{/* モバイル: フィルターアイコン */}
					<MobileFilterButton />
				</Flex>
			</div>
			{fieldValues.viewMode === 'month' ? (
				<div
					style={{
						height: scaledHeight > 0 ? `${scaledHeight}px` : 'auto',
						transition: 'height 0.2s ease',
						overflow: 'visible',
					}}
				>
					<div
						ref={calendarRef}
						style={{
							transform: `scale(${fieldValues.zoomLevel / 100})`,
							transformOrigin: 'top center',
							transition: 'transform 0.2s ease',
						}}
					>
						<Calendar.Grid className={css({ bg: 'white', mb: { base: '0', md: '8' } })}>
							{(date) => (
								<ScheduleCell
									dateValue={date}
									schedule={schedules.get(date.toString()) ?? []}
									onSelect={() => handleDateSelect(date.toString())}
									isSelected={fieldValues.selectedDate === date.toString()}
								/>
							)}
						</Calendar.Grid>
					</div>
				</div>
			) : (
				<WeekView schedules={schedules} weekStart={weekStart} currentDate={dayjs(date.toString())} />
			)}
			{/* モバイル用下部イベントリスト（月表示のみ） */}
			{fieldValues.viewMode === 'month' && <MobileEventList />}
		</Calendar.Root>
	);
};

const DISPLAY_COUNT = 3;

const toDayjs = (date: CalendarDate) => dayjs(date.toString());

// モバイル用イベントドット
const EventDots = ({ events }: { events: Schedule[] }) => {
	// イベントタイプごとにユニークなドットを表示（最大3つ）
	const uniqueTypes = [...new Set(events.map((e) => e.type.name))].slice(0, 3);

	return (
		<div
			className={css({
				display: { base: 'flex', md: 'none' },
				gap: '1',
				justifyContent: 'center',
				flexWrap: 'wrap',
				mt: '1',
			})}
		>
			{uniqueTypes.map((typeName, i) => {
				const color = typeVariants[typeName as keyof typeof typeVariants] || typeVariants.default;
				return (
					<span
						key={i}
						className={css({
							w: '6px',
							h: '6px',
							rounded: 'full',
						})}
						style={{ backgroundColor: color.bg }}
					/>
				);
			})}
		</div>
	);
};

const ScheduleCell = ({
	dateValue,
	schedule,
	onSelect,
	isSelected,
}: {
	dateValue: CalendarDate;
	schedule: Schedule[];
	onSelect?: () => void;
	isSelected?: boolean;
}) => {
	const dateStr = toDayjs(dateValue).format('MM/DD (dd)');
	const [open, setOpen] = useState(false);
	const [isInArea, setIsInArea] = useState(false);

	const handleClick = () => {
		// モバイル: 日付選択のみ
		// デスクトップ: ポップオーバー表示
		if (typeof window !== 'undefined' && window.innerWidth < 768) {
			onSelect?.();
		} else {
			if (schedule.length > 0) setOpen(true);
		}
	};

	if (schedule.length === 0) {
		return (
			<Calendar.Cell
				date={dateValue}
				onClick={onSelect}
				className={css({
					bg: isSelected ? 'blue.50' : undefined,
				})}
			/>
		);
	}

	return (
		<Popover.Root
			portalled
			lazyMount
			unmountOnExit
			open={open}
			onOpenChange={({ open }) => setOpen(open)}
			positioning={{ placement: 'left' }}
			closeOnInteractOutside={!isInArea}
		>
			<Popover.Anchor asChild>
				<Calendar.Cell
					date={dateValue}
					className={css({
						'& > * + *': { mt: 0.5 },
						cursor: 'pointer',
						bg: isSelected ? 'blue.50' : undefined,
					})}
					onClick={handleClick}
				>
					{/* デスクトップ: ScheduleLabel表示 */}
					<div className={css({ display: { base: 'none', md: 'block' } })}>
						{schedule.slice(0, DISPLAY_COUNT).map((d) => (
							<ScheduleLabel key={d.id} schedule={d} />
						))}
						{schedule.length > DISPLAY_COUNT && (
							<button
								type="button"
								onClick={() => setOpen(true)}
								className={css({ color: 'blue.600', fontSize: 'sm' })}
							>
								他&nbsp;{schedule.length - DISPLAY_COUNT}&nbsp;件
							</button>
						)}
					</div>
					{/* モバイル: イベントドット */}
					<EventDots events={schedule} />
				</Calendar.Cell>
			</Popover.Anchor>
			{/* ポップオーバー（デスクトップ用） */}
			<Portal>
				<Popover.Positioner className={css({ display: { base: 'none', md: 'block' } })}>
					<Popover.Content
						className={css({
							bg: 'white',
							shadow: 'lg',
							border: '1px solid',
							borderColor: 'gray.200',
							maxW: '350px',
						})}
						onPointerEnter={() => setIsInArea(true)}
						onPointerLeave={() => setIsInArea(false)}
					>
						<Flex justify={'space-between'} align={'center'} px="3" py="2">
							<p className={css({ fontWeight: 'semibold', fontSize: 'md' })}>
								{dateStr}
							</p>
							<Popover.CloseTrigger>
								<MdClose />
							</Popover.CloseTrigger>
						</Flex>
						<Divider color={'lightgray'} />
						<ScrollArea.Root>
							<ScrollArea.Viewport
								className={css({
									w: '100%',
									maxH: '300px',
								})}
							>
								<ScrollArea.Content>
									<ul className={css({ m: 0, p: 0, listStyle: 'none' })}>
										{schedule.map((d) => (
											<ScheduleListItem key={d.id} value={d} />
										))}
									</ul>
								</ScrollArea.Content>
							</ScrollArea.Viewport>
							<ScrollArea.Scrollbar>
								<ScrollArea.Thumb />
							</ScrollArea.Scrollbar>
							<ScrollArea.Corner />
						</ScrollArea.Root>
					</Popover.Content>
				</Popover.Positioner>
			</Portal>
		</Popover.Root>
	);
};

const ScheduleListItem = ({ value: d }: { value: Schedule }) => (
	<li key={d.id}>
		<Link
			href={`/events/${d.id}`}
			className={css({
				px: '3',
				py: '2',
				display: 'inline-block',
			})}
		>
			<Flex
				gap={2}
				rowGap={1}
				align={'center'}
				fontWeight={'medium'}
				flexWrap={'wrap'}
			>
				<p>
					{dayjs(d.startDatetime).format('HH:mm')}～
					{dayjs(d.endDatetime).format('HH:mm')}
				</p>
				<Flex gap={2} align={'center'}>
					<PublishTag
						bg={
							d.publishStatus === PUBLISH_STATUS.Published
								? 'orange.400'
								: 'gray.600'
						}
					>
						{PUBLISH_LABEL[d.publishStatus]}
					</PublishTag>
					<CityTag>{d.city}</CityTag>
					<TypeTag type={d.type.name as TypeVariantProps}>
						{d.type.name}
					</TypeTag>
				</Flex>
			</Flex>
			<p
				className={css({
					m: 'none',
					ml: '2',
					mt: '2',
					textWrap: 'wrap',
				})}
			>
				{d.name}
			</p>
		</Link>
		<Divider color={'lightgray'} />
	</li>
);

const PublishTag = styled('div', {
	base: {
		color: 'white',
		p: '0.5',
		fontSize: 'sm',
		rounded: 'sm',
	},
});

const CityTag = styled('div', {
	base: {
		color: 'white',
		bg: 'orange.400',
		p: '0.5',
		fontSize: 'sm',
		rounded: 'sm',
	},
});

type TypeVariantProps = StyledVariantProps<typeof TypeTag>['type'];
const TypeTag = styled('div', {
	base: {
		p: '0.5',
		fontSize: 'sm',
		rounded: 'sm',
	},
	variants: {
		type: typeVariants,
	},
	defaultVariants: {
		type: 'default',
	},
});
