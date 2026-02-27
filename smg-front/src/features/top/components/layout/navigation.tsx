'use client';

import { useFilteredRoutes } from '@/hooks/useFilteredRoutes';
import { css } from '@/styled-system/css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Navigation = () => {
	const pathname = usePathname();
	const { routes } = useFilteredRoutes();

	return (
		<div
			className={css({
				maxW: '72rem',
				mb: 2,
				display: { base: 'none', md: 'flex' },
				overflowX: 'auto',
			})}
		>
			{routes.map((d) =>
				d.linkType === 'external' ? (
					<a
						href={d.href}
						key={d.label}
						target="_blank"
						rel="noopener noreferrer"
						className={css({
							px: 2,
							pb: 1,
							borderBottom: '2px solid gray',
							_hover: { borderBottomColor: 'white' },
							borderBottomColor: 'gray',
						})}
					>
						{d.label}
					</a>
				) : (
					<Link
						href={d.href}
						key={d.label}
						className={css({
							px: 2,
							pb: 1,
							borderBottom: '2px solid gray',
							_hover: { borderBottomColor: 'white' },
							borderBottomColor: pathname === d.href ? 'white' : 'gray',
						})}
					>
						{d.label}
					</Link>
				),
			)}
		</div>
	);
};
