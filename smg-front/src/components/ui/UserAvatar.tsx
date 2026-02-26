'use client';

import { css, cx } from '@/styled-system/css';
import Image from 'next/image';

interface UserAvatarProps {
	src?: string;
	alt?: string;
	size?: number;
	className?: string;
}

export const UserAvatar = ({
	src,
	alt = 'user',
	size = 32,
	className,
}: UserAvatarProps) => (
	<Image
		alt={alt}
		className={cx(
			css({
				borderRadius: 'full',
				objectFit: 'cover',
				aspectRatio: '1 / 1',
				display: 'block',
			}),
			className,
		)}
		src={src || '/profile-icon.jpg'}
		width={size}
		height={size}
		quality={100}
		unoptimized={true}
		onError={(e) => {
			const target = e.target as HTMLImageElement;
			// 既にフォールバック画像の場合は何もしない（無限ループ防止）
			if (target.src.includes('/profile-icon.jpg')) {
				return;
			}
			target.src = '/profile-icon.jpg';
		}}
	/>
);
