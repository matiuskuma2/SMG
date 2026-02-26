import { Archive } from '@/features/top/components/archive';
import { Contact } from '@/features/top/components/contact';
import { Event } from '@/features/top/components/event';
import { CenteredContainer } from '@/features/top/components/layout';
import { PCFooter } from '@/features/top/components/layout/footer';
import { NavigationCard } from '@/features/top/components/navigation-card';
import { News } from '@/features/top/components/news';
import { Information } from '@/features/top/components/parts';
import { Radio } from '@/features/top/components/radio';
import { StartHere } from '@/features/top/components/start-here';
import { css, cx } from '@/styled-system/css';
import { Sawarabi_Mincho } from 'next/font/google';

const SawarabiMincho = Sawarabi_Mincho({
	weight: '400',
	subsets: ['latin'],
	display: 'swap',
});

const Page = () => (
	<div
		className={cx(
			SawarabiMincho.className,
			css({ display: 'flex', flexDir: 'column' }),
		)}
	>
		<main
			className={css({
				flex: 1,
				overflowY: 'auto',
				scrollBehavior: 'smooth',
				scrollPaddingTop: 6,
				scrollbar: 'hidden',
			})}
		>
			<Information />
			<div className={topStyle}>
				<CenteredContainer
					display={'grid'}
					gridTemplateColumns={{
						base: '1fr 1fr 1fr',
						mdDown: '1fr 1fr',
					}}
					gridAutoRows={{
						base: '150px',
						mdDown: 'auto',
					}}
					gap={4}
				>
					<NavigationCard
						href="/events"
						backgroundImage="/top/box-event.png"
						icon={{ src: '/top/icons/calendar.png', alt: 'event' }}
						gridColumn={{ base: 'auto', mdDown: 'span 2' }}
						color="white"
						pcText={
							<>
								講座
								<br />
								イベント予約
							</>
						}
						spText="講座・イベント予約"
					/>
					<NavigationCard
						href="/beginner"
						backgroundImage="/top/box-guide.png"
						gridRowStart={{ base: 'auto', mdDown: '2' }}
					>
						ご利用ガイド
					</NavigationCard>
					<NavigationCard href="/notice" backgroundImage="/top/box-news.png">
						お知らせ
					</NavigationCard>
					<NavigationCard
						href="/archive/tabs/regular"
						backgroundImage="/top/box-archive.png"
						icon={{ src: '/top/icons/monitor.png', alt: 'archive' }}
						gridColumn={{ base: 'auto', mdDown: 'span 2' }}
						color="white"
					>
						動画・写真
					</NavigationCard>
					<NavigationCard
						href="/radio"
						backgroundImage="/top/box-radio.png"
						gridRowStart={{ base: 'auto', mdDown: '4' }}
					>
						SMGラジオ
					</NavigationCard>
					<NavigationCard
						href="/questions"
						backgroundImage="/top/box-ask-coach.png"
						gridRowStart={{ base: 'auto', mdDown: '4' }}
					>
						講師に質問
					</NavigationCard>
				</CenteredContainer>
			</div>

			<Event />

			<StartHere />
			<News />
			<Archive />

			<Radio />
			<Contact />
			<PCFooter />
		</main>
	</div>
);
const topStyle = css({
	display: 'grid',
	placeItems: 'center',
	backgroundImage: 'url(/top/logo-background.png)',
	backgroundSize: 'cover',
	mdDown: {
		p: 4,
		pt: 8,
	},
	p: 8,
	pt: 16,
});

export default Page;
