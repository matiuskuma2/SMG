import { css } from '@/styled-system/css';
import type { EventData } from '@/types/event';
import Link from 'next/link';
import type React from 'react';
import { EventCard } from './EventCard';

export const EventSection: React.FC<EventData> = ({ events }) => {
	return (
		<section className={css({ p: '2rem', '& > * + *': { marginTop: '1rem' } })}>
			<h2 className={css({ fontSize: 'large', fontWeight: 'bold' })}>
				イベント予約
			</h2>
			<div
				className={css({
					display: 'grid',
					gridTemplateColumns: {
						base: '1fr',
						sm: 'repeat(2, 1fr)',
						md: 'repeat(2, 1fr)',
					},
					justifyContent: 'center',
					gap: '1rem',
				})}
			>
				{/* オフラインイベント */}
				<div
					className={css({
						display: 'flex',
						flexDirection: 'column',
						gap: '1rem',
						border: '2px solid #e2e8f0',
						borderRadius: '0.5rem',
						padding: '1rem',
						backgroundColor: '#f8fafc',
						marginLeft: '2rem',
						marginRight: '2rem',
					})}
				>
					<h3
						className={css({
							fontSize: 'md',
							fontWeight: 'bold',
							color: 'black',
						})}
					>
						オフラインイベント
					</h3>
					{events
						.filter((event) => !event.isOnline)
						.map((event) => (
							<EventCard key={event.event_id} {...event} />
						))}
				</div>

				{/* オンラインイベント */}
				<div
					className={css({
						display: 'flex',
						flexDirection: 'column',
						gap: '1rem',
						border: '2px solid #e2e8f0',
						borderRadius: '0.5rem',
						padding: '1rem',
						backgroundColor: '#f8fafc',
						marginLeft: '2rem',
						marginRight: '2rem',
					})}
				>
					<h3
						className={css({
							fontSize: 'md',
							fontWeight: 'bold',
							color: 'black',
						})}
					>
						オンラインイベント
					</h3>
					{events
						.filter((event) => event.isOnline)
						.map((event) => (
							<EventCard key={event.event_id} {...event} />
						))}
				</div>
			</div>
			<div className={css({ textAlign: 'center', mt: '4' })}>
				<Link
					href="/events"
					className={css({
						display: 'inline-block',
						bg: '#9D7636',
						color: 'white',
						px: '4',
						py: '2',
						rounded: 'md',
						fontWeight: 'bold',
						textDecoration: 'none',
						_hover: { bg: '#8A6A2F' },
					})}
				>
					すべてのイベントを見る
				</Link>
			</div>
		</section>
	);
};
