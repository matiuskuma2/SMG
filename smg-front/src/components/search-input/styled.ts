import { css } from '@/styled-system/css';

const container = css({
	display: 'flex',
	alignItems: 'center',
	width: 'auto',
	bg: '#f7f7f7',
	borderRadius: 'md',
	padding: '0.5rem',
	border: '1px solid #eeeeee',
	flex: 'auto',
	gap: '0.5rem',
});

const field = css({
	w: 'full',
	_focus: {
		outline: 'none',
	},
});

const icon = css({
	w: '1rem',
	h: '1rem',
});

export { container, field, icon };
