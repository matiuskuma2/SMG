'use client';

import type { Schedule } from '@/features/event-schedule/action/schedule';
import dayjs from '@/lib/dayjs';
import { css } from '@/styled-system/css';
import Link from 'next/link';
import { useSchedule, useScheduleContext } from '../../hooks/use-schedule';
import { typeVariants } from './item';

export const MobileEventList = () => {
	const { fieldValues } = useScheduleContext();
	const { schedules } = useSchedule();

	const selectedDate = fieldValues.selectedDate;

	if (!selectedDate) {
		return (
			<div
				className={css({
					display: { base: 'block', md: 'none' },
					p: '4',
					bg: 'gray.50',
					textAlign: 'center',
					color: 'gray.500',
					fontSize: 'sm',
				})}
			>
				日付をタップしてイベントを表示
			</div>
		);
	}

	const events = schedules.get(selectedDate) ?? [];
	const dateStr = dayjs(selectedDate).format('M月D日 (dd)');

	return (
		<div
			className={css({
				display: { base: 'block', md: 'none' },
				bg: 'white',
				borderTop: '1px solid',
				borderColor: 'gray.200',
				maxH: '300px',
				overflowY: 'auto',
			})}
		>
			<div
				className={css({
					position: 'sticky',
					top: 0,
					bg: 'white',
					px: '4',
					py: '3',
					borderBottom: '1px solid',
					borderColor: 'gray.100',
					fontWeight: 'semibold',
					fontSize: 'sm',
				})}
			>
				{dateStr}のイベント ({events.length}件)
			</div>

			{events.length === 0 ? (
				<div className={css({ p: '4', textAlign: 'center', color: 'gray.500', fontSize: 'sm' })}>
					この日のイベントはありません
				</div>
			) : (
				<ul className={css({ listStyle: 'none', m: 0, p: 0 })}>
					{events.map((event) => (
						<MobileEventItem key={event.id} event={event} />
					))}
				</ul>
			)}
		</div>
	);
};

const MobileEventItem = ({ event }: { event: Schedule }) => {
	const typeColor = typeVariants[event.type.name as keyof typeof typeVariants] || typeVariants.default;

	return (
		<li className={css({ borderBottom: '1px solid', borderColor: 'gray.100' })}>
			<Link
				href={`/events/${event.id}`}
				className={css({
					display: 'flex',
					gap: '3',
					p: '3',
					_hover: { bg: 'gray.50' },
				})}
			>
				{/* カラーインジケーター */}
				<div
					className={css({ w: '4px', rounded: 'full', flexShrink: 0, alignSelf: 'stretch' })}
					style={{ backgroundColor: typeColor.bg }}
				/>
				<div className={css({ flex: 1, minW: 0 })}>
					<div className={css({ fontSize: 'xs', color: 'gray.500', mb: '1' })}>
						{dayjs(event.startDatetime).format('HH:mm')} - {dayjs(event.endDatetime).format('HH:mm')}
						{event.city && ` | ${event.city}`}
					</div>
					<div
						className={css({
							fontWeight: 'medium',
							fontSize: 'sm',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
						})}
					>
						{event.name}
					</div>
					<span
						className={css({
							display: 'inline-block',
							mt: '1',
							px: '2',
							py: '0.5',
							fontSize: 'xs',
							rounded: 'sm',
						})}
						style={{ backgroundColor: typeColor.bg, color: typeColor.color }}
					>
						{event.type.name}
					</span>
				</div>
			</Link>
		</li>
	);
};
