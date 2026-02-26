import { css } from '@/styled-system/css'

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  questionTitle: string;
  truncateText: (text: string, limit?: number) => string;
  isDeleting?: boolean;
}

export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  questionTitle,
  truncateText,
  isDeleting = false
}: DeleteConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className={css({
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      bg: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
    })}>
      <div className={css({
        bg: 'white',
        rounded: 'md',
        p: '6',
        maxW: '400px',
        w: '90%',
        boxShadow: 'xl',
        position: 'relative',
        zIndex: 51,
      })}>
        <h3 className={css({
          fontSize: 'lg',
          fontWeight: 'bold',
          mb: '4',
        })}>
          質問を削除しますか？
        </h3>
        
        <p className={css({ mb: '6' })}>
          「{truncateText(questionTitle, 30)}」を削除します。この操作は取り消せません。
        </p>
        
        <div className={css({
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '3',
        })}>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className={css({
              px: '4',
              py: '2',
              rounded: 'md',
              bg: 'gray.100',
              color: 'gray.700',
              fontWeight: 'medium',
              _hover: { bg: isDeleting ? 'gray.100' : 'gray.200' },
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.5 : 1,
            })}
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={css({
              px: '4',
              py: '2',
              rounded: 'md',
              bg: isDeleting ? 'gray.400' : 'red.500',
              color: 'white',
              fontWeight: 'medium',
              _hover: { bg: isDeleting ? 'gray.400' : 'red.600' },
              cursor: isDeleting ? 'not-allowed' : 'pointer',
            })}
          >
            {isDeleting ? '削除中...' : '削除する'}
          </button>
        </div>
      </div>
    </div>
  );
}; 