import { Button } from '@/components/ui/button';
import { css } from '@/styled-system/css';
import type { EventApplicationButtonProps } from '@/types/event';
import type React from 'react';

const EventApplicationButton: React.FC<EventApplicationButtonProps> = ({
	applicationStatus,
	isApplicationSubmitted,
	onButtonClick,
}) => {
	const isCancel = applicationStatus === 'キャンセル';
	const isDisabled =
		applicationStatus === '受付は終了しました' ||
		applicationStatus === '申し込み期間終了' ||
		applicationStatus === '申し込み前' ||
		isApplicationSubmitted;

	return (
		<div
			className={css({
				mb: { base: '6', md: '8' },
				textAlign: 'center',
			})}
		>
			<Button
				className={css({
					w: 'full',
					py: { base: '4', md: '6' },
					fontSize: { base: 'md', md: 'lg' },
					bg:
						applicationStatus === '申し込み期間終了'
							? 'gray.300'
							: isCancel
								? '#dc2626'
								: '#877534', // キャンセルの場合は赤色
					_hover: {
						bg:
							applicationStatus === '申し込み期間終了'
								? 'gray.400'
								: isCancel
									? '#b91c1c'
									: '#6a5c2a',
					},
					color: 'white',
					fontWeight: 'bold',
					borderRadius: 'md',
					cursor: 'pointer',
				})}
				disabled={isDisabled}
				onClick={onButtonClick}
			>
				{isApplicationSubmitted ? 'キャンセル' : applicationStatus}
			</Button>
		</div>
	);
};

export default EventApplicationButton;
