import { css, cx } from '@/styled-system/css';
import { type BreakpointToken, token } from '@/styled-system/tokens';

export const Centerize = ({
	children,
	className,
	size = 'xl',
}: {
	children?: React.ReactNode;
	className?: string;
	size?: BreakpointToken;
}) => (
	<div className={css({ display: 'flex' })}>
		<div
			className={cx(className, css({ w: 'full', marginInline: 'auto' }))}
			style={{ maxWidth: token(`breakpoints.${size}`, size) }}
		>
			{children}
		</div>
	</div>
);
