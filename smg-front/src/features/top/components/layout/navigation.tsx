'use client';

import { ROUTE_DEFINITION } from '@/features/top/const';
import { css } from '@/styled-system/css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Navigation = () => {
	const pathname = usePathname();

	return (
		<div
			className={css({
				maxW: '72rem',
				mb: 2,
				display: { base: 'none', md: 'flex' },
				overflowX: 'auto',
			})}
		>
			{ROUTE_DEFINITION.map((d) => (
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
			))}
		</div>
	);
};
