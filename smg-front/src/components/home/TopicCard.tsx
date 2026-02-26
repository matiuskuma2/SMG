import { css } from '@/styled-system/css';
import Link from 'next/link';
import type React from 'react';

// トピックカードのProps型定義
export interface TopicCardProps {
	link: string;
	imageSrc?: string; // フル画像のソースを追加
	showOnlyImage?: boolean; // 画像のみを表示するかどうかのフラグを追加
	width?: string; // カードの幅
	height?: string; // カードの高さ
}

// トピックカードコンポーネント
export const TopicCard: React.FC<TopicCardProps> = ({
	link,
	imageSrc,
	width = '100%',
	height = '200px',
}) => (
	<Link
		href={link}
		className={css({
			display: 'block',
			_hover: { shadow: 'md' },
			h: height,
			w: width,
		})}
	>
		{imageSrc && (
			<div
				className={css({
					position: 'relative',
					width: '100%',
					height: '100%',
					mb: '0',
					overflow: 'hidden',
					rounded: 'md',
				})}
			>
				<img
					src={imageSrc}
					className={css({
						width: '100%',
						height: '100%',
						objectFit: 'contain',
						backgroundColor: 'gray.50',
					})}
				/>
			</div>
		)}
	</Link>
);
