import { css } from '@/styled-system/css';
import Link from 'next/link';
import type React from 'react';
import { NewsItem, type NewsItemProps } from './NewsItem';

// ニュースデータの型
export interface NewsData {
	news: NewsItemProps[];
	showAllNews?: boolean;
	totalCount?: number;
	onShowMore?: () => void;
	onShowLess?: () => void;
}

export const NewsSection: React.FC<NewsData> = ({
	news,
	showAllNews = false,
	totalCount = 0,
	onShowMore,
	onShowLess,
}) => {
	const hasMoreNews = totalCount > 5;
	const displayedCount = news.length;

	return (
		<section className={css({ px: '2rem', pb: '1.5rem', maxW: '100%' })}>
			<h2 className={css({ fontSize: 'md', fontWeight: 'bold', mb: '2' })}>
				お知らせ
			</h2>
			<div className={css({ p: '3', rounded: 'md' })}>
				{news.map((item) => (
					<NewsItem
						key={item.id}
						id={item.id}
						date={item.date}
						text={item.text}
					/>
				))}

				{/* もっと見る/表示を戻すボタン */}
				{hasMoreNews && (
					<div className={css({ mt: '4', textAlign: 'center' })}>
						{!showAllNews ? (
							<button
								type="button"
								onClick={onShowMore}
								className={css({
									px: '4',
									py: '2',
									bg: '#9D7636',
									color: 'white',
									rounded: 'md',
									fontSize: 'sm',
									fontWeight: 'bold',
									cursor: 'pointer',
									transition: 'all 0.2s',
									_hover: {
										bg: '#8A6A2F',
									},
								})}
							>
								もっと見る（全{totalCount}件）
							</button>
						) : (
							<button
								type="button"
								onClick={onShowLess}
								className={css({
									px: '4',
									py: '2',
									bg: 'gray.500',
									color: 'white',
									rounded: 'md',
									fontSize: 'sm',
									fontWeight: 'bold',
									cursor: 'pointer',
									transition: 'all 0.2s',
									_hover: {
										bg: 'gray.600',
									},
								})}
							>
								表示を戻す
							</button>
						)}
					</div>
				)}
			</div>
		</section>
	);
};
