import dayjs from '@/lib/dayjs';
import { css } from '@/styled-system/css';
import { AspectRatio, Flex, Grid, Stack, styled } from '@/styled-system/jsx';
import Link from 'next/link';

export type EventCardProps = {
	event: {
		id: string;
		name: string;
		imageUrl: string | null;
		event_start_datetime: string;
		event_end_datetime: string;
		registration_start_datetime: string;
		registration_end_datetime: string;
		type: {
			name: string;
		};
		city: string | null;
		isAttendee: boolean;
	};
};

export const EventCard = ({ event }: EventCardProps) => {
	const parsedStart = dayjs(event.event_start_datetime);
	const parsedEnd = dayjs(event.event_end_datetime);
	const parsedRegistStart = dayjs(event.registration_start_datetime);
	const parsedRegistEnd = dayjs(event.registration_end_datetime);
	return (
		<Grid
			bg={'white'}
			color={'bg-black'}
			fontFamily={'notosansjp'}
			rounded={'sm'}
			w={'260px'}
			pos={'relative'}
		>
			<AspectRatio w={'full'} ratio={16 / 9}>
				<Grid bg={'bg-gray'} roundedTop="sm" placeItems={'center'}>
					{event.imageUrl ? (
						<img
							src={event.imageUrl ?? ''}
							alt={event.name}
							className={css({
								h: 'auto',
								color: 'white',
								bg: 'bg-black',
								objectFit: 'contain',
							})}
						/>
					) : (
						<div
							className={css({
								boxSizing: 'border-box',
								p: 2,
								lineClamp: 2,
								wordBreak: 'break-word',
							})}
						>
							{event.name}
						</div>
					)}
				</Grid>
			</AspectRatio>

			<Stack px={4} py={2} fontWeight={'bold'} fontSize={'sm'} w={'full'}>
				<Flex gap={2}>
					<Tag>{event.type.name}</Tag>
					{event.city && <Tag>{event.city}</Tag>}
					{event.isAttendee && <Tag>申込済み</Tag>}
				</Flex>
				<p
					className={css({
						fontSize: 'md',
						lineClamp: 2,
						wordBreak: 'break-word',
						h: '12',
					})}
				>
					{event.name}
				</p>
				<Flex gap={1}>
					<div>開催日時：</div>
					<div>
						<p>{parsedStart.format('YYYY年M月D日 (ddd)')}</p>
						<p>
							{parsedStart.format('HH:mm')}-{parsedEnd.format('HH:mm')}
						</p>
					</div>
				</Flex>
				<Flex gap={1}>
					<div>申込期限：</div>
					<p>
						{parsedRegistStart.format('M/D')}~{parsedRegistEnd.format('M/D')}
					</p>
				</Flex>

				<Grid placeItems={'center'} py={2}>
					<Link
						href={`/events/${event.id}`}
						className={css({
							px: 4,
							py: 2,
							color: 'white',
							boxShadow: '0px 3px 2px 0px rgba(0, 0, 0, 0.3)',
							bg: event.isAttendee ? '#dc2626' : 'primary',
						})}
					>
						{event.isAttendee ? 'キャンセル' : 'イベントを予約する'}
					</Link>
				</Grid>
			</Stack>
		</Grid>
	);
};

const Tag = styled('span', {
	base: {
		fontSize: 'xs',
		fontWeight: 'md',
		p: 1,
		color: 'white',
		bg: 'gray.600',
	},
});
