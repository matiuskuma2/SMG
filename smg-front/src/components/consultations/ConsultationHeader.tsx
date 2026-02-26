import { css } from '@/styled-system/css';
import type { ConsultationHeaderProps } from './types';

export function ConsultationHeader({
	title,
	instructor,
	imageUrl,
}: ConsultationHeaderProps) {
	const headerStyles = css({
		bg: '#9E7631',
		color: 'white',
		p: '4',
	});

	const headerTitleStyles = css({
		fontSize: 'xl',
		fontWeight: 'bold',
		textAlign: 'center',
		whiteSpace: 'pre-line',
	});

	const instructorStyles = css({
		fontSize: 'sm',
		textAlign: 'center',
		mt: '2',
	});

	return (
		<div className={headerStyles}>
			<h1 className={headerTitleStyles}>
				{title || 'オンライン個別相談のご案内（予約申請）'}
			</h1>
			{instructor && <p className={instructorStyles}>講師: {instructor}</p>}
		</div>
	);
}
