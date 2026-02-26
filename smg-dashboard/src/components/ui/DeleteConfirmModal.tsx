import { css } from '@/styled-system/css';
import type React from 'react';
import { useEffect, useRef } from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
  targetName?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName = 'イベント',
  targetName,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogElement = dialogRef.current;
    if (!dialogElement) return;

    if (isOpen) {
      dialogElement.showModal();
    } else {
      dialogElement.close();
    }

    return () => {
      // コンポーネントのunmount時に開いていた場合は閉じる
      if (dialogElement.open) {
        dialogElement.close();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // モーダルコンテンツのクリックが背景に伝播しないようにする
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // 背景をクリックしたらモーダルを閉じる
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  // キーボードイベントのハンドラー
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (
      e.key === 'Enter' &&
      document.activeElement?.id === 'confirm-delete'
    ) {
      onConfirm();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={css({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bg: 'transparent',
        border: 'none',
        p: 0,
        m: 0,
        width: { base: '90%', sm: '400px' },
        maxW: '500px',
        zIndex: 50,
        '&::backdrop': {
          bg: 'rgba(0, 0, 0, 0.5)',
        },
      })}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      aria-labelledby="modal-title"
      aria-modal="true"
    >
      <div
        className={css({
          bg: 'white',
          rounded: 'md',
          p: 6,
          shadow: 'xl',
          width: '100%',
        })}
        onClick={handleContentClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleContentClick(e as unknown as React.MouseEvent);
          }
        }}
      >
        <h3
          id="modal-title"
          className={css({
            fontSize: 'xl',
            fontWeight: 'bold',
            mb: 4,
          })}
        >
          確認
        </h3>
        <p className={css({ mb: 6 })}>
          {targetName ? (
            <>
              {itemName}「
              <span className={css({ fontWeight: 'bold' })}>{targetName}</span>
              」を削除してもよろしいですか？
            </>
          ) : (
            <>この{itemName}を削除してもよろしいですか？</>
          )}
        </p>
        <div
          className={css({
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 3,
          })}
        >
          <button
            type="button"
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClose();
              }
            }}
            className={css({
              px: 4,
              py: 2,
              rounded: 'md',
              border: '1px solid',
              borderColor: 'gray.300',
              _hover: { bg: 'gray.50' },
            })}
          >
            キャンセル
          </button>
          <button
            id="confirm-delete"
            type="button"
            onClick={onConfirm}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onConfirm();
              }
            }}
            className={css({
              px: 4,
              py: 2,
              rounded: 'md',
              bg: 'red.500',
              color: 'white',
              _hover: { bg: 'red.600' },
            })}
          >
            削除する
          </button>
        </div>
      </div>
    </dialog>
  );
};
