'use client';

import { useBreakpoints } from '@/hooks/use-breakpoints';
import { css, cx } from '@/styled-system/css';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

type NavigationCardProps = {
	href: string;
	backgroundImage: string;
	children?: ReactNode;
	pcText?: ReactNode;
	spText?: ReactNode;
	icon?: {
		src: string;
		alt: string;
	};
	gridColumn?: {
		base?: string;
		mdDown?: string;
	};
	gridRowStart?: {
		base?: string;
		mdDown?: string;
	};
	color?: 'white' | 'primary';
};

const linkBaseStyle = css({
	backgroundSize: 'cover',
	backgroundPosition: 'center',
	width: 'full',
	textStyle: 'xl',
	shadow: 'primary',
	display: 'inline-flex',
	alignItems: 'center',
});

export const NavigationCard = ({
	href,
	backgroundImage,
	children,
	pcText,
	spText,
	icon,
	gridColumn,
	gridRowStart,
	color = 'primary',
}: NavigationCardProps) => {
	const { mdDown } = useBreakpoints();
	const isMd = !mdDown;
	const hasIcon = mdDown && !!icon;
	const displayText = pcText && spText ? (mdDown ? spText : pcText) : children;

	return (
		<Link
			href={href}
			style={{ backgroundImage: `url(${backgroundImage})` }}
			className={cx(
				linkBaseStyle,
				css({
					paddingBlock: hasIcon ? 4 : 6,
					paddingInline: hasIcon ? 4 : undefined,
					color,
					gap: hasIcon ? 4 : undefined,
					justifyContent: hasIcon ? undefined : 'center',
					gridColumn,
					gridRowStart,
					fontSize: mdDown ? 'md' : '4xl',
					textAlign: mdDown ? 'unset' : 'center',
					lineHeight: mdDown ? 'normal' : '1.2',
				}),
			)}
		>
			{hasIcon && icon && (
				<Image width={40} height={40} src={icon.src} alt={icon.alt} />
			)}
			{displayText}
		</Link>
	);
};
