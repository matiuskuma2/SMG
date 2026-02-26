import { css } from '@/styled-system/css';
import type React from 'react';
import { TopicCard, type TopicCardProps } from './TopicCard';

// トピックデータの型
export interface TopicData {
	topics: TopicCardProps[];
}

export const TopicSection: React.FC<TopicData> = ({ topics }) => {
	return (
		<section className={css({ p: '2rem', '& > * + *': { marginTop: '1rem' } })}>
			<div
				className={css({
					display: 'flex',
					alignItems: 'center',
					gap: '1rem',
					mb: '3',
				})}
			>
				<h2 className={css({ fontSize: 'large', fontWeight: 'bold' })}>
					トピック
				</h2>

				{/* スマホ表示時のみの注意書き */}
				<p
					className={css({
						display: { base: 'block', md: 'none' },
						fontSize: 'sm',
						color: 'gray.500',
					})}
				>
					スライドしてください
				</p>
			</div>

			{/* カードコンテナ */}
			<div
				className={css({
					position: 'relative',
					width: '100%',
				})}
			>
				<div
					className={css({
						display: 'flex',
						gap: '1rem',
						pb: '1rem',
						// PC表示ではflex-wrapで折り返し
						flexWrap: { base: 'nowrap', md: 'wrap' },
						justifyContent: { base: 'flex-start', md: 'flex-start' },
						// スマホ表示ではスクロール可能に
						overflowX: { base: 'auto', md: 'visible' },
						// スクロールバーを非表示にする
						scrollbarWidth: 'none',
						'&::-webkit-scrollbar': { display: 'none' },
						// スムーズスクロールを有効化
						scrollBehavior: 'smooth',
						// 慣性スクロールを有効化（iOSのみ）
						WebkitOverflowScrolling: 'touch',
						// スクロールスナップ
						scrollSnapType: { base: 'x mandatory', md: 'none' },
					})}
				>
					{topics.map((card, index) => (
						<div
							key={index}
							className={css({
								flexShrink: 0,
								// スマホサイズでは固定幅に、PCでは3分割のレスポンシブに
								width: { base: '80%', md: 'calc(33.333% - 0.67rem)' },
								minWidth: { base: '250px', md: 'auto' },
								marginBottom: '1rem',
								// スクロールスナップポイント
								scrollSnapAlign: { base: 'start', md: 'none' },
							})}
						>
							<TopicCard
								imageSrc={card.imageSrc}
								link={card.link}
								width="100%"
								height="100%"
							/>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};
