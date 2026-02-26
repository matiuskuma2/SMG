'use client';

import { useBreakpoints } from '@/hooks/use-breakpoints';
import type { NoticeListItem } from '@/lib/api/notice';
import { css } from '@/styled-system/css';
import { Flex } from '@/styled-system/jsx';
import Link from 'next/link';
import { LuChevronRight } from 'react-icons/lu';

export const NewsItem = ({ item }: { item: NoticeListItem }) => {
	const { mdDown } = useBreakpoints();

	// HTMLタグを除去してプレーンテキストに変換
	const stripHtml = (html: string) => {
		return html.replace(/<[^>]*>/g, '').trim();
	};

	return (
		<li
			className={css({
				borderBottom: '1px solid rgba(255,255,255, 0.6)',
				fontFamily: 'Noto Sans JP',
				m: 4,
				fontWeight: 'medium',
			})}
		>
			<Flex direction="column" gap={{ base: 2, mdDown: 2 }}>
				{!mdDown && (
					<Flex gap={2} align="center">
						<span className={css({ fontSize: 'sm', opacity: 0.9 })}>
							{item.date}
						</span>
						{item.category && (
							<span
								className={css({
									fontSize: 'xs',
									px: 2,
									py: 1,
									bg: 'primary',
									rounded: 'sm',
								})}
							>
								{item.category.name}
							</span>
						)}
					</Flex>
				)}
				<div className={css({ flex: 1 })}>
					<p className={css({ fontSize: 'md', fontWeight: 'bold' })}>
						{item.title}
					</p>
					{!mdDown && (
						<p
							className={css({
								fontSize: 'sm',
								mt: 2,
								opacity: 0.9,
								lineClamp: 2,
							})}
						>
							{stripHtml(item.details)}
						</p>
					)}
				</div>
			</Flex>
			<Flex justify={'end'} paddingBlock={2}>
				<Link
					href={`/notice?noticeId=${item.id}`}
					className={css({
						d: 'inline-flex',
						alignItems: 'center',
						gap: 1,
						fontSize: 'smaller',
					})}
				>
					もっと見る <LuChevronRight />
				</Link>
			</Flex>
		</li>
	);
};
