import { css } from '@/styled-system/css';
import { Flex, Grid, Stack } from '@/styled-system/jsx';
import Image from 'next/image';
import Link from 'next/link';
import { LuChevronRight } from 'react-icons/lu';
import { fetchEvents } from '../../actions/event';
import {
	CenteredContainer,
	Container,
	SectionFooter,
	SectionHeader,
} from '../layout';
import { ResponsiveText } from '../parts/responsive-text';
import { Calendar } from './calendar';
import { EventTabs } from './event-tabs';

export const Event = async () => {
	const { fixed, appliedEvents } = await fetchEvents();
	return (
		<Container
			className={css({
				backgroundImage: 'url(/top/bg-black.png)',
				color: 'white',
				py: { md: 24, base: 12 },
			})}
		>
			<CenteredContainer>
				<SectionHeader
					id="event"
					title={
						<ResponsiveText pcText="講座・イベント予約" spText="参加申込" />
					}
					subtitle="Event"
				/>
				{fixed && (
					<main
						className={css({
							paddingInline: 4,
							paddingBlock: 6,
							'& > * + *': {
								mt: 6,
							},
						})}
					>
						<Grid
							gap={8}
							gridTemplateColumns={{ base: '1fr 1fr', mdDown: '1fr' }}
						>
							<Stack textAlign={'center'}>
								<h3>
									<Link
										href="/mypage?tab=application-history"
										className={css({
											bg: 'primary',
											display: 'inline-block',
											w: 'fit-content',
											marginInline: 'auto',
											px: 4,
											py: 3,
										})}
									>
										申込済みの講座・イベント
									</Link>
								</h3>
								<ul>
									{appliedEvents.map((e) => (
										<li key={e.id}>
											<Link href={`/events/${e.id}`}>
												<Flex
													px={2}
													py={4}
													borderBottom={'1px solid rgba(255,255,255, 0.6)'}
												>
													{e.event_name}
												</Flex>
											</Link>
										</li>
									))}
								</ul>
							</Stack>
							<Calendar />
						</Grid>

						<EventTabs events={fixed} />
					</main>
				)}

				<SectionFooter href={'/events'}>
					講座一覧へ{' '}
					<LuChevronRight
						className={css({ display: 'inline', hideFrom: 'md' })}
					/>
					<Image
						src="/icons/arrow-up.svg"
						alt=""
						width={24}
						height={24}
						className={css({ display: 'inline', hideBelow: 'md' })}
					/>
				</SectionFooter>
			</CenteredContainer>
		</Container>
	);
};
