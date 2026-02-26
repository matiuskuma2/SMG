import React from 'react';
import { css, cx } from '@/styled-system/css';

interface EditButtonProps {
  onClick: () => void;
  className?: string;
}

export const EditButton: React.FC<EditButtonProps> = ({ onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={cx(css({
        position: 'absolute',
        top: { base: '4', md: '6' },
        right: { base: '4', md: '6' },
        px: '4',
        py: '2',
        bg: 'blue.600',
        color: 'white',
        borderRadius: 'md',
        fontSize: 'sm',
        fontWeight: 'medium',
        cursor: 'pointer',
        transition: 'all 0.2s',
        _hover: {
          bg: 'blue.700',
        },
        _active: {
          transform: 'scale(0.98)',
        },
      }), className)}
    >
      編集
    </button>
  );
};
