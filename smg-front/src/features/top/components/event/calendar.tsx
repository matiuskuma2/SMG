'use client';

import {
	type Schedule,
	fetchEventSchedules,
} from '@/features/event-schedule/action/schedule';
import { DEFAULT_LOCALE } from '@/features/top/const';
import dayjs from '@/lib/dayjs';
import { css, cx, sva } from '@/styled-system/css';
import { Flex } from '@/styled-system/jsx';
import { token } from '@/styled-system/tokens';
import { DatePicker, type DateValue } from '@ark-ui/react/date-picker';
import { Dialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import { useQuery } from '@tanstack/react-query';
import type { Dayjs } from 'dayjs';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { LuChevronLeft, LuChevronRight, LuX } from 'react-icons/lu';
import { modal } from '../parts';

const toDateKey = (date: DateValue, fmt = 'YYYY-MM-DD') =>
	dayjs(date.toDate(DEFAULT_LOCALE)).format(fmt);

const getColor = (v: string) => {
	if (v === '土') return 'blue';
	if (v === '日') return 'red';
	return token('colors.bg-black');
};

export const Calendar = () => {
	const [open, setOpen] = useState(false);
	const [events, setEvents] = useState<Schedule[]>([]);
	const [selected, setSelected] = useState<Dayjs | null>(null);
	const [focusValue, setFocusValue] = useState<string>(() =>
		dayjs().format('YYYY-MM'),
	);

	const table = dateTable();
	const modalStyle = modal();

	const { data: schedule } = useQuery({
		queryKey: ['event-schedules', focusValue],
		queryFn: async () => {
			const values = await fetchEventSchedules(focusValue);
			return Map.groupBy(values, (event) => {
				return dayjs(event.startDatetime).format('YYYY-MM-DD');
			});
		},
	});

	const setSelectedDate = useCallback(
		async (day: Dayjs | null) => {
			setSelected(day);
			const result = day ? (schedule?.get(day.format('YYYY-MM-DD')) ?? []) : [];
			setEvents(result);
			return result;
		},
		[schedule],
	);

	const onValueClick = async (value: DateValue) => {
		const result = await setSelectedDate(dayjs(value.toDate(DEFAULT_LOCALE)));
		if (result.length) setOpen(true);
	};

	const onDialogOpenChange = (e: Dialog.OpenChangeDetails) => {
		setOpen(e.open);
		if (!e.open) setSelectedDate(null);
	};

	return (
		<>
			<DatePicker.Root
				open
				locale="ja-JP"
				startOfWeek={1}
				value={[]}
				onValueChange={(v) => onValueClick(v.value[0])}
				onFocusChange={(v) =>
					setFocusValue(() => toDateKey(v.focusedValue, 'YYYY-MM'))
				}
			>
				<DatePicker.Content className={table.content}>
					<DatePicker.Context>
						{(datePicker) => (
							<>
								<DatePicker.ViewControl className={table.viewControl}>
									<DatePicker.PrevTrigger className={table.prev}>
										<LuChevronLeft />
									</DatePicker.PrevTrigger>
									<DatePicker.ViewTrigger>
										<DatePicker.RangeText />
									</DatePicker.ViewTrigger>
									<DatePicker.NextTrigger className={table.next}>
										<LuChevronRight />
									</DatePicker.NextTrigger>
								</DatePicker.ViewControl>
								<DatePicker.Table className={table.table}>
									<DatePicker.TableHead>
										<DatePicker.TableRow>
											{datePicker.weekDays.map((weekDay) => (
												<DatePicker.TableHeader
													key={weekDay.short}
													style={{ color: getColor(weekDay.short) }}
												>
													{weekDay.short}
												</DatePicker.TableHeader>
											))}
										</DatePicker.TableRow>
									</DatePicker.TableHead>
									<DatePicker.TableBody>
										{datePicker.weeks.map((week, id) => (
											// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
											<DatePicker.TableRow key={id} className={table.row}>
												{week.map((day, id) => (
													// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
													<DatePicker.TableCell key={id} value={day}>
														<DatePicker.TableCellTrigger
															className={table.cellTrigger}
														>
															{day.day}
															<Flex justify="center" mt={1} h={1.5}>
																{schedule?.has(toDateKey(day)) && (
																	<div className={dot} />
																)}
															</Flex>
														</DatePicker.TableCellTrigger>
													</DatePicker.TableCell>
												))}
											</DatePicker.TableRow>
										))}
									</DatePicker.TableBody>
								</DatePicker.Table>
							</>
						)}
					</DatePicker.Context>
				</DatePicker.Content>
			</DatePicker.Root>
			<Dialog.Root
				lazyMount
				unmountOnExit
				open={open}
				onOpenChange={onDialogOpenChange}
			>
				<Portal>
					<Dialog.Backdrop className={modalStyle.backdrop} />
					<Dialog.Positioner
						className={cx(
							modalStyle.positioner,
							css({
								display: 'grid',
								placeItems: 'center',
							}),
						)}
					>
						<Dialog.Content
							className={cx(
								modalStyle.content,
								css({
									gap: 2,
									color: 'black',
									p: 6,
									bg: 'bg-gray/95',
								}),
							)}
						>
							<Flex justify={'flex-end'}>
								<Dialog.CloseTrigger>
									<LuX size={24} />
								</Dialog.CloseTrigger>
							</Flex>
							{selected && (
								<Flex gap={4}>
									<div className={css({ textAlign: 'center' })}>
										<span
											className={css({
												textStyle: '2xl',
												fontWeight: 'medium',
											})}
										>
											{selected.format('D')}
										</span>
										<br />
										<span style={{ color: getColor(selected.format('dd')) }}>
											{selected.format('dd')}
										</span>
									</div>
									<ul
										className={css({
											display: 'flex',
											flexDir: 'column',
											gap: 2,
											flex: 1,
											maxH: '300px',
											overflowY: 'auto',
											scrollbar: 'hidden',
										})}
									>
										{events.map((e) => (
											<Link
												href={`/events/${e.id}`}
												className={css({
													bg: 'bg-black',
													color: 'white',
													width: '100%',
													px: 2,
													py: 1,
												})}
												key={e.id}
											>
												<p>
													{dayjs(e.startDatetime).format('HH:mm')}~
													{dayjs(e.endDatetime).format('HH:mm')}
												</p>
												<p>{e.name}</p>
											</Link>
										))}
									</ul>
								</Flex>
							)}
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</>
	);
};

const dot = css({
	w: 1.5,
	h: 1.5,
	rounded: 'full',
	bg: '#d54422',
});

const dateTable = sva({
	slots: [
		'cellTrigger',
		'content',
		'table',
		'viewControl',
		'prev',
		'next',
		'rangeText',
		'row',
	],
	base: {
		content: {
			w: 'full',
			bg: 'white',
			color: 'black',
			p: 6,
			rounded: 'sm',
			fontFamily: 'notosansjp',
			fontWeight: 'medium',
		},
		table: {
			w: 'full',
			textAlign: 'center',
			mt: 2,
		},
		cellTrigger: {
			fontWeight: 'medium',
			cursor: 'pointer',
			paddingBlock: 2,
			'&[data-outside-range]': { visibility: 'hidden' },
			'&[data-today]': { color: 'primary', fontWeight: 'bold' },
			userSelect: 'none',
		},
		viewControl: {
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
		},
		prev: {
			color: 'gray',
		},
		next: {
			color: 'gray',
		},
	},
});
