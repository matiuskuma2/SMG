import { Input } from '@/components/ui/input';
import { css } from '@/styled-system/css';
import type { FaqInput } from '@/types/faq';
import type React from 'react';

type FaqFormProps = {
  isEditing: boolean;
  initialData?: Partial<FaqInput>;
  onSubmit: (data: FaqInput) => Promise<void>;
  onCancel: () => void;
};

export const FaqForm = ({
  isEditing,
  initialData = {},
  onSubmit,
  onCancel,
}: FaqFormProps) => {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const displayOrder = Number(formData.get('display_order'));

    const data: FaqInput = {
      title,
      description,
      display_order: displayOrder,
    };

    try {
      await onSubmit(data);
    } catch (error) {
      console.error('フォーム送信中にエラーが発生しました:', error);
      throw error;
    }
  };

  return (
    <div
      className={css({
        mx: 'auto',
        maxW: '900px',
        p: '3',
      })}
    >
      <div
        className={css({
          p: '6',
          bg: 'white',
          borderRadius: 'md',
          boxShadow: 'sm',
          mt: '8',
          mb: '8',
        })}
      >
        <h1
          className={css({
            fontSize: '2xl',
            fontWeight: 'bold',
            mb: '6',
            borderBottom: '1px solid',
            borderColor: 'gray.200',
            pb: '4',
          })}
        >
          {isEditing ? 'FAQの編集' : 'FAQの作成'}
        </h1>

        <form onSubmit={handleSubmit}>
          {/* 質問 */}
          <div className={css({ mb: '6' })}>
            <label
              htmlFor="title"
              className={css({
                display: 'block',
                mb: '2',
                fontWeight: 'semibold',
                color: 'gray.700',
              })}
            >
              質問 <span className={css({ color: 'red.500' })}>*</span>
            </label>
            <Input
              type="text"
              id="title"
              name="title"
              defaultValue={initialData.title}
              required
            />
          </div>

          {/* 回答 */}
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
              回答 <span className={css({ color: 'red.500' })}>*</span>
            </label>
            <textarea
              id="description"
              name="description"
              defaultValue={initialData.description}
              rows={8}
              required
              className={css({
                w: 'full',
                p: '2',
                border: '1px solid',
                borderColor: 'gray.300',
                borderRadius: 'md',
                _focus: {
                  outline: 'none',
                  borderColor: 'blue.500',
                  boxShadow: '0 0 0 1px blue.500',
                },
              })}
            />
          </div>

          {/* 表示順 */}
          <div className={css({ mb: '6' })}>
            <label
              htmlFor="display_order"
              className={css({
                display: 'block',
                mb: '2',
                fontWeight: 'semibold',
                color: 'gray.700',
              })}
            >
              表示順 <span className={css({ color: 'red.500' })}>*</span>
            </label>
            <Input
              type="number"
              id="display_order"
              name="display_order"
              defaultValue={initialData.display_order || 1}
              required
              min={1}
            />
          </div>

          {/* ボタン */}
          <div
            className={css({
              display: 'flex',
              gap: '4',
              justifyContent: 'center',
              mt: '8',
            })}
          >
            <button
              type="button"
              onClick={onCancel}
              className={css({
                px: '6',
                py: '3',
                borderRadius: 'md',
                fontWeight: 'semibold',
                border: '1px solid',
                borderColor: 'gray.300',
                bg: 'white',
                color: 'gray.700',
                cursor: 'pointer',
                _hover: {
                  bg: 'gray.50',
                },
              })}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className={css({
                px: '6',
                py: '3',
                borderRadius: 'md',
                fontWeight: 'semibold',
                bg: 'blue.500',
                color: 'white',
                cursor: 'pointer',
                _hover: {
                  bg: 'blue.600',
                },
              })}
            >
              {isEditing ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
