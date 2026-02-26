import { css } from '@/styled-system/css';
import { Flex, styled } from '@/styled-system/jsx';
import { token } from '@/styled-system/tokens';
import Image from 'next/image';
import Link, { type LinkProps } from 'next/link';
import type { ReactNode } from 'react';

export const Container = styled('section', {
	base: {
		py: {
			base: 12,
			mdDown: 6,
		},
		px: 2,
	},
});

const SectionTitle = styled('h2', {
	base: {
		fontSize: '4xl',
	},
});

export const SectionHeader = (props: {
	id?: string;
	title: string | ReactNode;
	subtitle: string;
	description?: string | ReactNode;
}) => (
	<header id={props.id} className={css({ textAlign: 'center' })}>
		<p
			className={css({
				color: 'primary',
				textDecoration: 'underline',
				fontSize: { md: '2xl' },
			})}
		>
			{props.subtitle}
		</p>
		<SectionTitle> {props.title}</SectionTitle>
		{props.description && (
			<p className={css({ textStyle: 'md' })}>{props.description}</p>
		)}
	</header>
);

const ToListLink = styled(Link, {
	base: {
		d: 'inline-block',
		bg: 'primary',
		py: {
			base: 4,
			mdDown: 2,
		},
		px: {
			base: 8,
			mdDown: 4,
		},
		color: 'white',
		shadow: 'primary',
		fontSize: {
			base: '2xl',
			mdDown: 'md',
		},
	},
});

export const SectionFooter = (props: React.PropsWithChildren<LinkProps>) => (
	<footer className={css({ d: 'grid', placeItems: 'center', paddingBlock: 3 })}>
		<ToListLink {...props} />
	</footer>
);

export { ToListLink };

export const CenteredContainer = styled('div', {
	base: {
		maxW: '920px',
		w: 'full',
		marginInline: 'auto',
	},
});

type NavIconProps = {
	iconUrl: string;
	label: string;
	active?: boolean;
	alt?: string;
} & Pick<LinkProps, 'href'>;

export const NavLink = ({
	alt = '',
	active = false,
	...props
}: NavIconProps) => (
	<Link
		href={props.href}
		className={css({
			display: 'flex',
			h: '100%',
			aspectRatio: '1',
			justifyContent: 'center',
			rounded: 'full',
		})}
		style={
			active
				? {
						transform: 'translateY(-12px)',
						background: token('colors.primary'),
					}
				: {}
		}
	>
		<Flex
			flexDir={'column'}
			alignItems="center"
			justifyContent="center"
			gap={1}
		>
			<Image
				src={props.iconUrl}
				width={16}
				height={16}
				className={css({ w: '16px', h: '16px' })}
				alt={alt}
			/>
			<p className={css({ fontSize: 'xs', textWrap: 'nowrap' })}>
				{props.label}
			</p>
		</Flex>
	</Link>
);
