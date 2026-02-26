'use client';

import { useBreakpoints } from '@/hooks/use-breakpoints';
import type { ReactNode } from 'react';

type ResponsiveTextProps = {
	pcText: ReactNode;
	spText: ReactNode;
};

export const ResponsiveText = ({ pcText, spText }: ResponsiveTextProps) => {
	const { mdDown } = useBreakpoints();
	return <>{mdDown ? spText : pcText}</>;
};
