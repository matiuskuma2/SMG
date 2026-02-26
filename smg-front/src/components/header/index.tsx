'use client';

import Image from 'next/image';
import { LuBell, LuMessagesSquare } from 'react-icons/lu';

import * as style from './styled';

import { NavMenu } from '@/components/nav';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { SearchForm } from '@/components/search/SearchForm';
import { css } from '@/styled-system/css';
import Link from 'next/link';
import { useNotification } from '@/components/NotificationContext';

interface HeaderProps {
	userIconUrl?: string;
}

export const Header = ({ userIconUrl }: HeaderProps) => {
	const { unreadCount } = useNotification();
	return (
	<header className={style.root}>
		<div className={style.content}>
			<Link href="/">
				<h1>
					<Image src={'/logo.png'} alt="SMB経営塾" width={160} height={32} quality={100} unoptimized={true} />
				</h1>
			</Link>

			<div className={css({
				display: 'none',
				'@media (min-width: 768px)': {
					display: 'block',
					flex: '1',
					minW: '0',
					overflow: 'hidden',
					paddingLeft: '0.5rem',
					paddingRight: '0.5rem',
				},
			})}>
				<SearchForm />
			</div>

			<div className={css({ display: 'flex', gap: '2rem', flexShrink: 0 })}>
				<Link href="/notification" className={css({ position: 'relative', borderRadius: 'full', display: 'grid', placeItems: 'center' })}>
					<LuBell size={20} />
					{unreadCount > 0 && (
						<span className={css({
							position: 'absolute',
							top: '0',
							right: '0',
							bg: 'red.500',
							color: 'white',
							rounded: 'full',
							w: '1rem',
							h: '1rem',
							fontSize: 'xs',
							textAlign: 'center',
							lineHeight: '1rem',
						})}>
							{unreadCount}
						</span>
					)}
				</Link>

				<Link
					href="/message"
					className={css({
						borderRadius: 'full',
						display: 'grid',
						placeItems: 'center',
					})}
				>
					<LuMessagesSquare size={20} />
				</Link>

				<Link href={'/mypage'} className={css({ cursor: 'pointer' })}>
					<UserAvatar src={userIconUrl} />
				</Link>
			</div>
		</div>

		{/* モバイル用検索フォーム（768px未満で表示） */}
		<div className={css({
			display: 'block',
			'@media (min-width: 768px)': {
				display: 'none',
			},
		})}>
			<SearchForm />
		</div>

		<div className={style.navRow}>
			<NavMenu />
		</div>
	</header>
	);
};
