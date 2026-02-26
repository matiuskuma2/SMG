import React from 'react';
import { css } from '@/styled-system/css';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message
}) => {
  if (!isOpen) return null;

  return (
    <div className={css({
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    })}>
      <div className={css({
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      })}>
        <h3 className={css({
          fontSize: '1.25rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: 'gray.800'
        })}>{title}</h3>
        
        <p className={css({
          marginBottom: '2rem',
          color: 'gray.600'
        })}>{message}</p>

        <div className={css({
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem'
        })}>
          <button
            onClick={onClose}
            className={css({
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              backgroundColor: 'gray.100',
              color: 'gray.700',
              fontWeight: 'bold',
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'gray.200'
              }
            })}
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className={css({
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              backgroundColor: 'red.500',
              color: 'white',
              fontWeight: 'bold',
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'red.600'
              }
            })}
          >
            確認
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal; 