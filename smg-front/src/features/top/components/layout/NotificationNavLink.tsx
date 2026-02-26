'use client';

import { useNotification } from '@/components/NotificationContext';
import { css } from '@/styled-system/css';
import { Flex } from '@/styled-system/jsx';
import Image from 'next/image';
import Link from 'next/link';

export const NotificationNavLink = () => {
	const { unreadCount } = useNotification();
	return (
		<Link
			href="/notification"
			className={css({
				display: 'flex',
				h: '100%',
				aspectRatio: '1',
				justifyContent: 'center',
				rounded: 'full',
				position: 'relative',
			})}
		>
			<Flex
				flexDir={'column'}
				alignItems="center"
				justifyContent="center"
				gap={1}
			>
				<Image
					src="/top/icons/notification.png"
					width={16}
					height={16}
					className={css({ w: '16px', h: '16px' })}
					alt=""
				/>
				<p className={css({ fontSize: 'xs', textWrap: 'nowrap' })}>通知</p>
			</Flex>
			{unreadCount > 0 && (
				<span
					className={css({
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
					})}
				>
					{unreadCount}
				</span>
			)}
		</Link>
	);
};
