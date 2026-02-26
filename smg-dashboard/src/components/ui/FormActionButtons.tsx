import { Button } from '@/components/ui/button';
import { css } from '@/styled-system/css';

type FormActionButtonsProps = {
  isEditing: boolean;
  onCancel: () => void;
  onDelete?: () => void;
  onSaveDraft?: () => void;
  isSubmitting?: boolean;
  submitText?: string;
  cancelText?: string;
  deleteText?: string;
  draftText?: string;
};

export const FormActionButtons = ({
  isEditing,
  onCancel,
  onDelete,
  onSaveDraft,
  isSubmitting = false,
  submitText,
  cancelText = 'キャンセル',
  deleteText = '削除',
  draftText = '下書き保存',
}: FormActionButtonsProps) => {
  const defaultSubmitText = isSubmitting
    ? '処理中...'
    : isEditing
      ? '更新'
      : '作成';

  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '4',
        mt: '6',
      })}
    >
      <Button
        type="button"
        onClick={onCancel}
        className={css({
          px: '6',
          py: '2',
          bg: 'gray.200',
          color: 'gray.800',
          rounded: 'md',
          _hover: { bg: 'gray.300' },
        })}
        disabled={isSubmitting}
      >
        {cancelText}
      </Button>
      {isEditing && onDelete && (
        <Button
          type="button"
          onClick={onDelete}
          className={css({
            px: '6',
            py: '2',
            bg: 'red.600',
            color: 'white',
            rounded: 'md',
            _hover: { bg: 'red.700' },
          })}
          disabled={isSubmitting}
        >
          {deleteText}
        </Button>
      )}
      {onSaveDraft && (
        <Button
          type="button"
          onClick={onSaveDraft}
          className={css({
            px: '6',
            py: '2',
            bg: 'gray.500',
            color: 'white',
            rounded: 'md',
            _hover: { bg: 'gray.600' },
          })}
          disabled={isSubmitting}
        >
          {draftText}
        </Button>
      )}
      <Button
        type="submit"
        className={css({
          px: '6',
          py: '2',
          bg: 'blue.600',
          color: 'white',
          rounded: 'md',
          cursor: 'pointer',
          _hover: { bg: 'blue.700' },
        })}
        disabled={isSubmitting}
      >
        {submitText || defaultSubmitText}
      </Button>
    </div>
  );
};
