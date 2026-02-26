import { type NoticeListItem, getNotices } from '@/lib/api/notice';
import { css } from '@/styled-system/css';
import Image from 'next/image';
import Link from 'next/link';
import { LuChevronRight } from 'react-icons/lu';
import {
	CenteredContainer,
	Container,
	SectionFooter,
	SectionHeader,
} from './layout';
import { NewsItem } from './news-item';

export const News = async () => {
	const { notices: news } = await getNotices('', 'date_desc', '', 1, 3);

	return (
		<Container
			className={css({
				backgroundImage: {
					base: 'url(/top/bg-news-pc.png)',
					mdDown: 'url(/top/bg-news.png)',
				},
				color: 'white',
				backgroundPositionX: 'center',
				backgroundSize: 'cover',
				backgroundRepeat: 'no-repeat',
				display: 'grid',
				placeItems: 'center',
			})}
		>
			<CenteredContainer>
				<SectionHeader id="news" title="お知らせ" subtitle="News" />

				<main>
					<ul>
						{news?.map((item) => (
							<NewsItem key={item.id} item={item} />
						))}
					</ul>
				</main>
				<SectionFooter href={'/notice'}>
					お知らせ一覧へ{' '}
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
