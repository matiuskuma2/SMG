'use client';

import { token } from '@/styled-system/tokens';
import type { BreakpointToken } from '@/styled-system/tokens';
import { useEffect, useState } from 'react';

type Breakpoint = BreakpointToken;

const breakpoints: Record<Breakpoint, number> = {
	'2xs': Number.parseInt(token('breakpoints.2xs')),
	xs: Number.parseInt(token('breakpoints.xs')),
	sm: Number.parseInt(token('breakpoints.sm')),
	md: Number.parseInt(token('breakpoints.md')),
	lg: Number.parseInt(token('breakpoints.lg')),
	xl: Number.parseInt(token('breakpoints.xl')),
	'2xl': Number.parseInt(token('breakpoints.2xl')),
};

export const useBreakpoints = () => {
	const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('sm');

	useEffect(() => {
		// マウント時に正しい値をセット
		setCurrentBreakpoint(getBreakpoint(window.innerWidth));

		const handleResize = () => {
			setCurrentBreakpoint(getBreakpoint(window.innerWidth));
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const xsDown = ['2xs', 'xs'].includes(currentBreakpoint);
	const smDown = ['2xs', 'xs', 'sm'].includes(currentBreakpoint);
	const mdDown = ['2xs', 'xs', 'sm', 'md'].includes(currentBreakpoint);
	const lgDown = ['2xs', 'xs', 'sm', 'md', 'lg'].includes(currentBreakpoint);
	const xlDown = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl'].includes(
		currentBreakpoint,
	);

	return {
		breakpoint: currentBreakpoint,
		xsDown,
		smDown,
		mdDown,
		lgDown,
		xlDown,
	};
};

const getBreakpoint = (width: number): Breakpoint => {
	if (width >= breakpoints['2xl']) return '2xl';
	if (width >= breakpoints.xl) return 'xl';
	if (width >= breakpoints.lg) return 'lg';
	if (width >= breakpoints.md) return 'md';
	if (width >= breakpoints.sm) return 'sm';
	if (width >= breakpoints.xs) return 'xs';
	return '2xs';
};
