import { css } from '@/styled-system/css';

type FormButtonsProps = {
  isEditing: boolean;
  onCancel: () => void;
  isSubmitting?: boolean;
  formId?: string;
};

export const FormButtons = ({
  isEditing,
  onCancel,
  isSubmitting = false,
  formId,
}: FormButtonsProps) => {
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
      _disabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
        _hover: { opacity: 0.5 },
        _active: { transform: 'none' },
      },
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
        disabled={isSubmitting}
      >
        キャンセル
      </button>
      <button
        type="submit"
        form={formId}
        className={`${buttonStyles.base} ${buttonStyles.solid}`}
        disabled={isSubmitting}
      >
        {isEditing ? '更新する' : '作成する'}
      </button>
    </div>
  );
};
