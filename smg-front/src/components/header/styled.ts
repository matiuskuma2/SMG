import { css } from '@/styled-system/css';

export const root = css({
	padding: '0.5rem 1rem',
	position: 'relative',
	zIndex: 10,
	'& > *': {
		maxW: '1200px',
		width: 'auto',
		marginInline: 'auto',
	},
	'& > * + *': {
		marginTop: '.5rem',
	},
});

export const content = css({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	gap: '1rem',
	overflow: 'hidden',
});

export const navRow = css({
	display: 'flex',
	justifyContent: 'center',
	overflowX: 'auto',
	width: '100%',

	'& > nav': {
		flex: '0 1 auto',
		minWidth: '0',
	},
});
