import { css } from '@/styled-system/css';
import type { HomeEventCardProps } from '@/types/event';
import Link from 'next/link';
import type React from 'react';

// イベントカードコンポーネント
export const EventCard: React.FC<HomeEventCardProps> = ({
	event_id,
	event_name,
	event_start_datetime,
	event_end_datetime,
	event_location,
	image_url,
}) => {
	// 日時をフォーマットする関数
	const formatDateTime = (startDateTime: string, endDateTime: string) => {
		const startDate = new Date(startDateTime);
		const endDate = new Date(endDateTime);

		const formatDate = (date: Date) => {
			return `${date.getMonth() + 1}/${date.getDate()}`;
		};

		const formatTime = (date: Date) => {
			return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
		};

		const startDateStr = formatDate(startDate);
		const startTimeStr = formatTime(startDate);
		const endDateStr = formatDate(endDate);
		const endTimeStr = formatTime(endDate);

		// 同じ日付の場合は終了時刻に日付を含めない
		if (startDateStr === endDateStr) {
			return `${startDateStr} ${startTimeStr} ～ ${endTimeStr}`;
		} else {
			return `${startDateStr} ${startTimeStr} ～ ${endDateStr} ${endTimeStr}`;
		}
	};

	return (
		<Link href={`/events/${event_id}`}>
			<div
				className={css({
					bg: 'white',
					rounded: 'md',
					overflow: 'hidden',
					cursor: 'pointer',
					_hover: { shadow: 'md' },
					h: '100%',
					display: 'flex',
					flexDirection: 'column',
				})}
			>
				<div
					className={css({
					aspectRatio: '16/9',
					bg: 'gray.100',
					overflow: 'hidden',
					borderRadius: 'md',
					})}
				>
					{image_url ? (
						<img
							src={image_url}
							alt={event_name}
							className={css({
								w: '100%',
								h: 'auto',
								objectFit: 'contain',
								objectPosition: 'center',
							})}
						/>
					) : (
						<div
							className={css({
								w: 'full',
								h: 'full',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: 'gray.400',
							})}
						>
							イメージ
						</div>
					)}
				</div>
				<div className={css({ p: '3', flex: '1' })}>
					<div
						className={css({
							fontSize: 'sm',
							fontWeight: 'bold',
							color: 'gray.600',
							mb: '1',
						})}
					>
						{formatDateTime(event_start_datetime, event_end_datetime)}
					</div>
					<h3 className={css({ fontWeight: 'bold', fontSize: 'md', mb: '2' })}>
						{event_name}
					</h3>
					<div className={css({ fontSize: 'xs', color: 'gray.500' })}>
						{event_location}
					</div>
				</div>
			</div>
		</Link>
	);
};
