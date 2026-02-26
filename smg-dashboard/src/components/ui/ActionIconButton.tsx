import { Button } from '@/components/ui/button';
import { css, cx } from '@/styled-system/css';
import type { ReactNode } from 'react';
import { FaPen, FaTrash } from 'react-icons/fa6';

export const iconButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: '2',
  py: '2',
  borderRadius: 'md',
  cursor: 'pointer',
  width: '32px',
  height: '32px',
  color: 'white',
  _hover: { color: 'white' },
});

interface ActionButtonsProps {
  targetId: string;
  handleEdit: (id: string) => void;
  handleDelete?: (id: string) => void;
  children?: ReactNode;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  targetId,
  handleEdit,
  handleDelete,
  children,
}) => {
  return (
    <div className={css({ display: 'flex', gap: '2' })}>
      {children}
      <Button
        size="sm"
        variant="outline"
        aria-label="編集する"
        className={cx(
          iconButtonStyle,
          css({
            bg: 'blue.400',
            borderColor: 'blue.600',
            _hover: { bg: 'blue.700' },
          }),
        )}
        onClick={() => handleEdit(targetId)}
      >
        <FaPen size={14} />
      </Button>
      {handleDelete && (
        <Button
          size="sm"
          variant="outline"
          aria-label="削除する"
          className={cx(
            iconButtonStyle,
            css({
              bg: 'red.400',
              borderColor: 'red.600',
              _hover: { bg: 'red.700' },
            }),
          )}
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(targetId);
          }}
        >
          <FaTrash size={14} />
        </Button>
      )}
    </div>
  );
};
