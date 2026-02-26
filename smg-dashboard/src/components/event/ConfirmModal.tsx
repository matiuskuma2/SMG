import { css } from '@/styled-system/css';
import { vstack } from '@/styled-system/patterns';

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '確認',
  cancelText = 'キャンセル',
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className={css({
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bg: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      })}
    >
      <div
        className={css({
          bg: 'white',
          p: '6',
          borderRadius: 'lg',
          maxW: 'md',
          w: 'full',
          mx: '4',
        })}
      >
        <div className={vstack({ gap: '4' })}>
          <h3
            className={css({
              fontSize: 'lg',
              fontWeight: 'bold',
              color: 'gray.900',
            })}
          >
            {title}
          </h3>
          <p className={css({ color: 'gray.600' })}>{message}</p>
          <div
            className={css({
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '3',
              mt: '4',
            })}
          >
            <button
              type="button"
              onClick={onClose}
              className={css({
                px: '4',
                py: '2',
                borderRadius: 'md',
                border: '1px solid',
                borderColor: 'gray.300',
                bg: 'white',
                color: 'gray.700',
                _hover: { bg: 'gray.50' },
              })}
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={css({
                px: '4',
                py: '2',
                borderRadius: 'md',
                bg: 'red.500',
                color: 'white',
                _hover: { bg: 'red.600' },
              })}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
