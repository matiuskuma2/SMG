import { css } from '@/styled-system/css';
import Link from 'next/link';
import type React from 'react';

// お知らせアイテムのProps型定義
export interface NewsItemProps {
	id: number;
	date: string;
	text: string;
}

// お知らせコンポーネント
export const NewsItem: React.FC<NewsItemProps> = ({ id, date, text }) => {
	// idがundefinedの場合の警告
	if (id === undefined || id === null) {
		console.error('NewsItem: id is undefined or null!', { id, date, text });
		return null; // レンダリングしない
	}

	return (
		<Link
			href={`/notice?noticeId=${id}`}
			className={css({
				display: 'block',
				py: '0.75rem',
				px: '1rem',
				transition: 'background-color 0.2s',
				cursor: 'pointer',
				textDecoration: 'none',
				color: 'inherit',
				_hover: {
					color: 'blue.600',
					backgroundColor: 'gray.100',
				}
			})}
		>
			<div
				className={css({
					display: 'flex',
					borderBottom: '1px solid',
					borderColor: 'gray.500',
					py: '2',
				})}
			>
				<span
					className={css({
						fontSize: 'sm',
						color: 'gray.800',
						mr: '4',
						whiteSpace: 'nowrap',
					})}
				>
					{date}
				</span>
				<span className={css({ fontSize: 'sm' })}>{text}</span>
			</div>
		</Link>
	);
};