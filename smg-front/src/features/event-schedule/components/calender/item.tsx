'use client';

import { type AriaButtonProps, useButton } from '@react-aria/button';
import { useRef } from 'react';

export const ActionButton = (props: AriaButtonProps) => {
	const ref = useRef<HTMLButtonElement>(null);
	const { buttonProps } = useButton(props, ref);

	return (
		<button {...buttonProps} ref={ref}>
			{props.children}
		</button>
	);
};
