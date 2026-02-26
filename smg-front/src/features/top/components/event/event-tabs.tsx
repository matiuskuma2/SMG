'use client';

import { useBreakpoints } from '@/hooks/use-breakpoints';
import { css } from '@/styled-system/css';
import { Grid } from '@/styled-system/jsx';
import { flex } from '@/styled-system/patterns';
import { Carousel } from '@ark-ui/react/carousel';
import { useState } from 'react';
import { CarouselRoot } from '../parts';
import { EventCard, type EventCardProps } from './event-card';

type Event = EventCardProps['event'];

type EventTabsProps = {
	events: Event[];
};

const EVENT_TYPES = [
	{ value: '定例会', label: '定例会' },
	{
		value: '5大都市グループ相談会&交流会',
		label: (
			<>
				5大都市グループ
				<br />
				相談会&交流会
			</>
		),
	},
	{ value: 'PDCA会議実践講座', label: 'PDCA会議実践講座' },
	{ value: '簿記講座', label: '簿記講座' },
	{ value: 'オンラインセミナー', label: 'オンラインセミナー' },
	{ value: '特別セミナー', label: '特別セミナー' },
];

export const EventTabs = ({ events }: EventTabsProps) => {
	const { mdDown } = useBreakpoints();
	const [activeTab, setActiveTab] = useState(EVENT_TYPES[0].value);

	if (mdDown) {
		// モバイル: カルーセル表示（開催日時が近い順にソート）
		const sortedEvents = [...events].sort((a, b) => {
			const dateA = new Date(a.event_start_datetime).getTime();
			const dateB = new Date(b.event_start_datetime).getTime();
			return dateA - dateB;
		});

		if (sortedEvents.length === 0) {
			return (
				<div
					className={css({
						textAlign: 'center',
						py: 8,
						color: 'white',
					})}
				>
					閲覧できるイベントがありません
				</div>
			);
		}

		return (
			<CarouselRoot
				allowMouseDrag
				defaultPage={0}
				slideCount={sortedEvents.length}
				slidesPerPage={{
					'2xs': 1.3,
					md: 2.5,
					sm: 2,
					xs: 1.5,
					lg: 3,
					xl: 3,
					'2xl': 3,
				}}
				spacing="12px"
			>
				<Carousel.ItemGroup>
					{sortedEvents.map((item, i) => (
						<Carousel.Item
							className={flex({ justify: 'center' })}
							snapAlign="center"
							key={item.id}
							index={i}
						>
							<EventCard event={item} />
						</Carousel.Item>
					))}
				</Carousel.ItemGroup>
			</CarouselRoot>
		);
	}

	// PC: タブ表示
	const filteredEvents = events.filter((e) => e.type.name === activeTab);

	return (
		<div>
			<div
				className={css({
					mt: 12,
					display: 'flex',
					justifyContent: 'space-between',
					gap: 2,
					borderBottom: {
						base: '0',
						mdDown: '2px solid',
					},
					borderColor: 'gray.700',
					mb: {
						base: 0,
						mdDown: 6,
					},
					overflowX: 'auto',
					scrollbar: 'hidden',
				})}
			>
				{EVENT_TYPES.map((type) => (
					<button
						key={type.value}
						type="button"
						onClick={() => setActiveTab(type.value)}
						className={css({
							flex: 1,
							fontSize: 'sm',
							fontWeight: 'medium',
							cursor: 'pointer',
							transition: 'all 0.2s',
							bg: activeTab === type.value ? 'rgb(206, 206, 206)' : 'white',
							color: 'black',
							wordWrap: 'break-word',
						})}
					>
						{type.label}
					</button>
				))}
			</div>
			<div className={css({ p: 4, bg: 'rgb(206, 206, 206)' })}>
				{filteredEvents.length === 0 ? (
					<div
						className={css({
							textAlign: 'center',
							py: 8,
							color: 'gray.600',
							height: '402px',
							alignItems: 'center',
							justifyContent: 'center',
							display: 'flex',
						})}
					>
						<p>閲覧できるイベントがありません</p>
					</div>
				) : (
					<Grid
						gap={4}
						gridTemplateColumns={{
							base: 'repeat(auto-fill, minmax(260px, 1fr))',
						}}
						justifyItems="center"
					>
						{filteredEvents.map((event) => (
							<div key={event.id}>
								<EventCard event={event} />
							</div>
						))}
					</Grid>
				)}
			</div>
		</div>
	);
};
