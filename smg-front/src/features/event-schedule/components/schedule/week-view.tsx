'use client';

import type { Schedule } from '@/features/event-schedule/action/schedule';
import dayjs from '@/lib/dayjs';
import type { Dayjs } from 'dayjs';
import { css } from '@/styled-system/css';
import Link from 'next/link';
import { useMemo } from 'react';
import { typeVariants } from './item';

type WeekViewProps = {
	schedules: Map<string, Schedule[]>;
	weekStart: Dayjs;
	currentDate: Dayjs; // 現在選択中の日付（モバイルで1日表示用）
};

// 30分単位の時間スロットを生成（0:00〜23:30 = 48スロット）
const generateTimeSlots = () => {
	const slots: { hour: number; minute: number; label: string }[] = [];
	for (let i = 0; i < 48; i++) {
		const hour = Math.floor(i / 2);
		const minute = (i % 2) * 30;
		slots.push({
			hour,
			minute,
			label: `${hour}時${minute === 0 ? '00' : minute}分`,
		});
	}
	return slots;
};

const timeSlots = generateTimeSlots();

// イベントの開始時刻から時間スロットのインデックスを計算
const getTimeSlotIndex = (datetime: string) => {
	const d = dayjs(datetime);
	const hour = d.hour();
	const minute = d.minute();
	return hour * 2 + (minute >= 30 ? 1 : 0);
};

// イベントの高さ（スロット数）を計算
const getEventHeight = (startDatetime: string, endDatetime: string) => {
	const start = dayjs(startDatetime);
	let end = dayjs(endDatetime);

	// 終了時刻が翌日以降の場合は、当日の23:59までに制限
	if (!end.isSame(start, 'day')) {
		end = start.endOf('day');
	}

	const diffMinutes = end.diff(start, 'minute');

	// 0分以下の場合は最小高さ
	if (diffMinutes <= 0) {
		return 1;
	}

	// 最大48スロット（24時間）に制限
	return Math.min(48, Math.ceil(diffMinutes / 30));
};

type EventWithPosition = {
	event: Schedule;
	startSlot: number;
	height: number;
	column: number;
	totalColumns: number;
};

// 重なりを検出してカラム位置を計算
const calculateEventPositions = (
	events: { event: Schedule; startSlot: number; height: number }[],
): EventWithPosition[] => {
	if (events.length === 0) return [];

	// 開始時刻でソート
	const sorted = [...events].sort((a, b) => a.startSlot - b.startSlot);

	const result: EventWithPosition[] = [];
	const columns: { endSlot: number }[] = [];

	for (const ev of sorted) {
		const endSlot = ev.startSlot + ev.height;

		// 使用可能なカラムを探す
		let column = 0;
		while (column < columns.length && columns[column].endSlot > ev.startSlot) {
			column++;
		}

		// カラムを更新または追加
		if (column < columns.length) {
			columns[column].endSlot = endSlot;
		} else {
			columns.push({ endSlot });
		}

		result.push({
			...ev,
			column,
			totalColumns: 0, // 後で計算
		});
	}

	// 各イベントの重なり数を計算
	for (const ev of result) {
		const evEnd = ev.startSlot + ev.height;
		// このイベントと重なる他のイベントを探す
		const overlapping = result.filter((other) => {
			const otherEnd = other.startSlot + other.height;
			return (
				ev !== other &&
				ev.startSlot < otherEnd &&
				evEnd > other.startSlot
			);
		});
		const maxColumn = Math.max(ev.column, ...overlapping.map((o) => o.column));
		ev.totalColumns = maxColumn + 1;
	}

	return result;
};

export const WeekView = ({ schedules, weekStart, currentDate }: WeekViewProps) => {
	// 週の7日分の日付を生成
	const weekDays = useMemo(() => {
		return Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));
	}, [weekStart]);

	// 週内のイベントを曜日別に整理（重なり計算付き）
	const eventsByDay = useMemo(() => {
		const result: Record<number, EventWithPosition[]> = {};

		for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
			const dateStr = weekDays[dayIndex].format('YYYY-MM-DD');
			const dayEvents = schedules.get(dateStr) || [];

			const eventsWithSlots = dayEvents.map((event) => ({
				event,
				startSlot: getTimeSlotIndex(event.startDatetime),
				height: getEventHeight(event.startDatetime, event.endDatetime),
			}));

			result[dayIndex] = calculateEventPositions(eventsWithSlots);
		}

		return result;
	}, [schedules, weekDays]);

	// モバイル用：現在の日付のイベント
	const currentDayEvents = useMemo(() => {
		const dateStr = currentDate.format('YYYY-MM-DD');
		const dayEvents = schedules.get(dateStr) || [];

		const eventsWithSlots = dayEvents.map((event) => ({
			event,
			startSlot: getTimeSlotIndex(event.startDatetime),
			height: getEventHeight(event.startDatetime, event.endDatetime),
		}));

		return calculateEventPositions(eventsWithSlots);
	}, [schedules, currentDate]);

	return (
		<>
			{/* デスクトップ: 週表示 */}
			<div
				className={css({
					display: { base: 'none', md: 'block' },
					bg: 'white',
					shadow: 'sm',
					roundedBottom: 'sm',
					overflow: 'auto',
					maxH: '600px',
					isolation: 'isolate',
				})}
			>
				{/* ヘッダー行 */}
				<div
					className={css({
						display: 'grid',
						gridTemplateColumns: '80px repeat(7, 1fr)',
						borderBottom: '1px solid',
						borderColor: 'gray.200',
						bg: 'gray.100',
						position: 'sticky',
						top: 0,
						zIndex: 10,
					})}
				>
					<div className={css({ h: '33px' })} />
					{weekDays.map((day, index) => (
						<div
							key={index}
							className={css({
								h: '33px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontWeight: 'medium',
								fontSize: 'sm',
								borderLeft: '1px solid',
								borderColor: 'gray.200',
								color: index === 0 ? 'red.500' : index === 6 ? 'blue.500' : 'inherit',
							})}
						>
							{day.date()}
						</div>
					))}
				</div>

				{/* 時間グリッド */}
				<div
					className={css({
						display: 'grid',
						gridTemplateColumns: '80px repeat(7, 1fr)',
					})}
				>
					{/* 時間軸 */}
					<div>
						{timeSlots.map((slot, index) => (
							<div
								key={index}
								className={css({
									h: '30px',
									pr: '2',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'flex-end',
									fontSize: 'xs',
									color: 'gray.500',
									borderBottom: '1px solid',
									borderColor: 'gray.100',
								})}
							>
								{slot.label}
							</div>
						))}
					</div>

					{/* 各曜日のカラム */}
					{weekDays.map((_, dayIndex) => (
						<div
							key={dayIndex}
							className={css({
								position: 'relative',
								borderLeft: '1px solid',
								borderColor: 'gray.200',
							})}
						>
							{/* 時間グリッドの背景 */}
							{timeSlots.map((_, slotIndex) => (
								<div
									key={slotIndex}
									className={css({
										h: '30px',
										borderBottom: '1px solid',
										borderColor: 'gray.100',
									})}
								/>
							))}

							{/* イベント */}
							{eventsByDay[dayIndex]?.map(({ event, startSlot, height, column, totalColumns }) => {
								const typeColor = typeVariants[event.type.name as keyof typeof typeVariants] || typeVariants.default;
								const widthPercent = 100 / totalColumns;
								const leftPercent = column * widthPercent;
								return (
									<Link
										key={event.id}
										href={`/events/${event.id}`}
										className={css({
											position: 'absolute',
											rounded: 'sm',
											px: '1',
											py: '0.5',
											fontSize: 'xs',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
											zIndex: 1,
										})}
										style={{
											top: `${startSlot * 30}px`,
											height: `${height * 30 - 2}px`,
											left: `calc(${leftPercent}% + 2px)`,
											width: `calc(${widthPercent}% - 4px)`,
											backgroundColor: typeColor.bg,
											color: typeColor.color,
										}}
										title={`${dayjs(event.startDatetime).format('HH:mm')}〜${dayjs(event.endDatetime).format('HH:mm')} ${event.name}`}
									>
										{dayjs(event.startDatetime).format('HH:mm')}〜{dayjs(event.endDatetime).format('HH:mm')} {event.name}
									</Link>
								);
							})}
						</div>
					))}
				</div>
			</div>

			{/* モバイル: 1日表示 */}
			<div
				className={css({
					display: { base: 'block', md: 'none' },
					bg: 'white',
					shadow: 'sm',
					roundedBottom: 'sm',
					overflow: 'auto',
					maxH: '500px',
				})}
			>
				{/* 時間グリッド */}
				<div
					className={css({
						display: 'grid',
						gridTemplateColumns: '50px 1fr',
					})}
				>
					{/* 時間軸 */}
					<div>
						{timeSlots.filter((_, i) => i % 2 === 0).map((slot, index) => (
							<div
								key={index}
								className={css({
									h: '60px',
									pr: '2',
									display: 'flex',
									alignItems: 'flex-start',
									justifyContent: 'flex-end',
									fontSize: 'xs',
									color: 'gray.500',
									borderBottom: '1px solid',
									borderColor: 'gray.100',
								})}
							>
								{slot.hour}:00
							</div>
						))}
					</div>

					{/* イベントカラム */}
					<div
						className={css({
							position: 'relative',
							borderLeft: '1px solid',
							borderColor: 'gray.200',
						})}
					>
						{/* 時間グリッドの背景 */}
						{timeSlots.map((_, slotIndex) => (
							<div
								key={slotIndex}
								className={css({
									h: '30px',
									borderBottom: slotIndex % 2 === 1 ? '1px solid' : 'none',
									borderColor: 'gray.100',
								})}
							/>
						))}

						{/* イベント */}
						{currentDayEvents.map(({ event, startSlot, height, column, totalColumns }) => {
							const typeColor = typeVariants[event.type.name as keyof typeof typeVariants] || typeVariants.default;
							const widthPercent = 100 / totalColumns;
							const leftPercent = column * widthPercent;
							return (
								<Link
									key={event.id}
									href={`/events/${event.id}`}
									className={css({
										position: 'absolute',
										rounded: 'sm',
										px: '2',
										py: '1',
										fontSize: 'xs',
										overflow: 'hidden',
										zIndex: 1,
									})}
									style={{
										top: `${startSlot * 30}px`,
										height: `${height * 30 - 2}px`,
										left: `calc(${leftPercent}% + 2px)`,
										width: `calc(${widthPercent}% - 4px)`,
										backgroundColor: typeColor.bg,
										color: typeColor.color,
									}}
								>
									<div className={css({ fontWeight: 'medium' })}>
										{dayjs(event.startDatetime).format('HH:mm')}〜{dayjs(event.endDatetime).format('HH:mm')}
									</div>
									<div className={css({ mt: '0.5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' })}>
										{event.name}
									</div>
								</Link>
							);
						})}
					</div>
				</div>
			</div>
		</>
	);
};
