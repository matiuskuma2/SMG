import { css } from '@/styled-system/css';

type EventFormButtonsProps = {
  isEditing: boolean;
  onCancel: () => void;
  onSaveDraft?: () => void;
};

export const EventFormButtons = ({
  isEditing,
  onCancel,
  onSaveDraft,
}: EventFormButtonsProps) => {
  const buttonStyles = {
    base: css({
      px: '6',
      py: '3',
      borderRadius: 'md',
      fontWeight: 'medium',
      fontSize: 'base',
      transition: 'all 0.2s',
      cursor: 'pointer',
      _hover: { opacity: 0.8 },
      _active: { transform: 'scale(0.98)' },
    }),
    solid: css({
      bg: 'blue.500',
      color: 'white',
      _hover: { bg: 'blue.600' },
    }),
    outline: css({
      border: '1px solid',
      borderColor: 'gray.300',
      _hover: { bg: 'gray.50' },
    }),
  };

  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'center',
        gap: '4',
        mt: '4',
      })}
    >
      <button
        type="button"
        onClick={onCancel}
        className={`${buttonStyles.base} ${buttonStyles.outline}`}
      >
        キャンセル
      </button>
      {onSaveDraft && (
        <button
          type="button"
          onClick={onSaveDraft}
          className={css({
            px: '6',
            py: '3',
            borderRadius: 'md',
            fontWeight: 'medium',
            fontSize: 'base',
            transition: 'all 0.2s',
            cursor: 'pointer',
            bg: 'gray.500',
            color: 'white',
            _hover: { bg: 'gray.600', opacity: 0.8 },
            _active: { transform: 'scale(0.98)' },
          })}
        >
          下書き保存
        </button>
      )}
      <button
        type="submit"
        className={`${buttonStyles.base} ${buttonStyles.solid}`}
      >
        {isEditing ? '更新する' : '作成する'}
      </button>
    </div>
  );
};
