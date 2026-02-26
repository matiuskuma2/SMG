import { css } from '@/styled-system/css';
import type { EventBannerProps } from '@/types/event';

export const EventBanner = ({ image_url, event_name }: EventBannerProps) => {
	// 画像がない場合は何も表示しない
	if (!image_url) {
		return null;
	}

	return (
		<div
			className={css({
				textAlign: 'center',
				position: 'relative',
				marginTop: { base: '2', md: '3' },
			})}
		>
			<div
				className={css({
					position: 'relative',
					aspectRatio: '16/9',
					width: '100%',
					overflow: 'hidden',
					borderRadius: 'lg',
					marginBottom: { base: '2', md: '4' },
				})}
			>
				<img
					src={image_url}
					alt={event_name}
					className={css({
						mb: { base: '2', md: '4' },
						borderRadius: 'lg',
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						objectPosition: 'center',
					})}
				/>
			</div>
		</div>
	);
};
