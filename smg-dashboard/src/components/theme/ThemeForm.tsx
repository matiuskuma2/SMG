'use client';

import { Button } from '@/components/ui/button';
import { css } from '@/styled-system/css';
import type React from 'react';
import { useState } from 'react';

export interface ThemeFormData {
  theme_name: string;
  description: string;
}

interface ThemeFormProps {
  onSubmit: (data: ThemeFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: ThemeFormData;
  isEditing?: boolean;
  onDelete?: () => Promise<void>;
}

export const ThemeForm: React.FC<ThemeFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  onDelete,
}) => {
  const [formData, setFormData] = useState<ThemeFormData>(
    initialData || {
      theme_name: '',
      description: '',
    },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!window.confirm('本当に削除しますか?')) return;

    setIsSubmitting(true);
    try {
      await onDelete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={css({
        p: { base: '4', xl: '8' },
        pt: { base: '4', xl: '20' },
        minH: 'calc(100vh - 64px)',
      })}
    >
      <div
        className={css({
          bg: 'white',
          rounded: 'lg',
          shadow: 'sm',
          overflow: 'hidden',
          maxW: '800px',
          mx: 'auto',
        })}
      >
        {/* ヘッダー */}
        <div
          className={css({
            p: { base: '4', xl: '6' },
            borderBottom: '1px solid',
            borderColor: 'gray.200',
          })}
        >
          <h1
            className={css({
              fontSize: { base: 'xl', xl: '2xl' },
              fontWeight: 'bold',
              textAlign: 'center',
            })}
          >
            {isEditing ? 'テーマの編集' : 'テーマの作成'}
          </h1>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit}>
          <div className={css({ p: { base: '4', xl: '6' } })}>
            <div className={css({ mb: '6' })}>
              <label
                htmlFor="theme_name"
                className={css({
                  display: 'block',
                  mb: '2',
                  fontWeight: 'semibold',
                  color: 'gray.700',
                })}
              >
                テーマ名 <span className={css({ color: 'red.500' })}>*</span>
              </label>
              <input
                id="theme_name"
                type="text"
                value={formData.theme_name}
                onChange={(e) =>
                  setFormData({ ...formData, theme_name: e.target.value })
                }
                required
                className={css({
                  w: 'full',
                  px: '4',
                  py: '2',
                  border: '1px solid',
                  borderColor: 'gray.300',
                  rounded: 'md',
                  fontSize: 'md',
                  _focus: {
                    outline: 'none',
                    borderColor: 'blue.500',
                    ring: '2px',
                    ringColor: 'blue.200',
                  },
                })}
                placeholder="テーマ名を入力してください"
              />
            </div>

            <div className={css({ mb: '6' })}>
              <label
                htmlFor="description"
                className={css({
                  display: 'block',
                  mb: '2',
                  fontWeight: 'semibold',
                  color: 'gray.700',
                })}
              >
                説明
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className={css({
                  w: 'full',
                  px: '4',
                  py: '2',
                  border: '1px solid',
                  borderColor: 'gray.300',
                  rounded: 'md',
                  fontSize: 'md',
                  resize: 'vertical',
                  _focus: {
                    outline: 'none',
                    borderColor: 'blue.500',
                    ring: '2px',
                    ringColor: 'blue.200',
                  },
                })}
                placeholder="テーマの説明を入力してください（任意）"
              />
            </div>
          </div>

          {/* アクションボタン */}
          <div
            className={css({
              p: { base: '4', xl: '6' },
              borderTop: '1px solid',
              borderColor: 'gray.200',
              display: 'flex',
              gap: '3',
              justifyContent: 'flex-end',
            })}
          >
            <Button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className={css({
                px: '6',
                py: '2',
                bg: 'gray.200',
                color: 'gray.700',
                rounded: 'md',
                _hover: { bg: 'gray.300' },
                _disabled: { opacity: '0.5', cursor: 'not-allowed' },
              })}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={css({
                px: '6',
                py: '2',
                bg: 'blue.600',
                color: 'white',
                rounded: 'md',
                cursor: 'pointer',
                _hover: { bg: 'blue.700' },
                _disabled: { opacity: '0.5', cursor: 'not-allowed' },
              })}
            >
              {isSubmitting ? '処理中...' : isEditing ? '更新' : '作成'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
