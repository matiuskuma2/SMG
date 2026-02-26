import { css, cva } from '@/styled-system/css';
import Image from 'next/image';
import React from 'react';

// サイズごとのスタイルを定義
const avatarStyles = cva({
  base: {
    rounded: 'full',
    bg: 'gray.200',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'gray.600',
    fontWeight: 'medium',
  },
  variants: {
    size: {
      sm: {
        w: '8',
        h: '8',
        fontSize: 'xs',
      },
      md: {
        w: '10',
        h: '10',
        fontSize: 'sm',
      },
      lg: {
        w: '12',
        h: '12',
        fontSize: 'md',
      },
      xl: {
        w: '16',
        h: '16',
        fontSize: 'lg',
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// avatarStylesの型を拡張して、classプロパティを許可する
type AvatarStylesProps = Parameters<typeof avatarStyles>[0] & {
  class?: string;
};

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'アバター',
  name,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = React.useState(false);

  // Next.jsの画像最適化URLから元のURLを抽出する関数
  const getOriginalUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const imageUrl = urlObj.searchParams.get('url');
      return imageUrl ? decodeURIComponent(imageUrl) : url;
    } catch {
      return url;
    }
  };

  return (
    <div
      className={avatarStyles({ size, class: className } as AvatarStylesProps)}
    >
      {src && !imgError ? (
        <Image
          src={getOriginalUrl(src)}
          alt={alt}
          width={
            size === 'xl' ? 64 : size === 'lg' ? 48 : size === 'md' ? 40 : 32
          }
          height={
            size === 'xl' ? 64 : size === 'lg' ? 48 : size === 'md' ? 40 : 32
          }
          className={css({ w: 'full', h: 'full', objectFit: 'cover' })}
          onError={() => setImgError(true)}
        />
      ) : (
        <Image
          src="/profile-icon.jpg"
          alt={alt}
          width={
            size === 'xl' ? 64 : size === 'lg' ? 48 : size === 'md' ? 40 : 32
          }
          height={
            size === 'xl' ? 64 : size === 'lg' ? 48 : size === 'md' ? 40 : 32
          }
          className={css({ w: 'full', h: 'full', objectFit: 'cover' })}
        />
      )}
    </div>
  );
};
