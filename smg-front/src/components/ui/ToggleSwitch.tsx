import { css } from '@/styled-system/css';
import type React from 'react';

interface ToggleSwitchProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	className?: string;
	id?: string;
	disabled?: boolean;
	label?: string;
}

const toggleStyles = {
	wrapper: css({
		display: 'inline-flex',
		alignItems: 'center',
		cursor: 'pointer',
		gap: '2',
	}),
	input: css({
		opacity: 0,
		width: '0',
		height: '0',
		position: 'absolute',
	}),
	bar: css({
		position: 'relative',
		width: '40px',
		height: '24px',
		background: 'gray.300',
		borderRadius: '9999px',
		transition: 'background 0.3s',
		flexShrink: 0,
	}),
	barChecked: css({
		background: '#003F74',
	}),
	circle: css({
		position: 'absolute',
		top: '2px',
		left: '2px',
		width: '20px',
		height: '20px',
		background: 'white',
		borderRadius: '50%',
		boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
		transition: 'transform 0.3s',
	}),
	circleChecked: css({
		transform: 'translateX(16px)',
	}),
	label: css({
		fontSize: 'sm',
		color: 'gray.700',
		userSelect: 'none',
	}),
};

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
	checked,
	onChange,
	className,
	id,
	disabled = false,
	label,
}) => (
	<label className={`${toggleStyles.wrapper} ${className ?? ''}`} htmlFor={id}>
		{label && <span className={toggleStyles.label}>{label}</span>}
		<span
			className={[
				toggleStyles.bar,
				checked ? toggleStyles.barChecked : '',
			].join(' ')}
		>
			<input
				id={id}
				type="checkbox"
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
				className={toggleStyles.input}
				disabled={disabled}
			/>
			<span
				className={[
					toggleStyles.circle,
					checked ? toggleStyles.circleChecked : '',
				].join(' ')}
			/>
		</span>
	</label>
);

export default ToggleSwitch;
