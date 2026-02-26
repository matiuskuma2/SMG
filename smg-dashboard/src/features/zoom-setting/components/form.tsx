'use client';

import type { InsertMstMeetingLink } from '@/lib/supabase/types';
import { css, cx } from '@/styled-system/css';
import { Flex } from '@/styled-system/jsx';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { createMettingLink, updateMettingLink } from '../actions';
import { inputStyle } from '../styled';
import { ActionBtn } from './button';

type FormProps = {
  mode?: 'create' | 'edit';
  defaultValues?: Partial<InsertMstMeetingLink>;
};

const initialValues: Omit<InsertMstMeetingLink, 'meeting_link_id'> = {
  title: '',
  meeting_link: '',
};

export const MeetingLinkForm = ({
  mode = 'create',
  defaultValues = initialValues,
}: FormProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: defaultValues.title || '',
    meeting_link: defaultValues.meeting_link || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({
    title: false,
    meeting_link: false,
  });

  useEffect(() => {
    setFormData({
      title: defaultValues.title || '',
      meeting_link: defaultValues.meeting_link || '',
    });
  }, [defaultValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.title.trim()) {
      errors.push('名前を入力してください');
    }

    if (!formData.meeting_link.trim()) {
      errors.push('リンクを入力してください');
    } else {
      try {
        new URL(formData.meeting_link);
      } catch (e) {
        errors.push('有効なURLを入力してください');
      }
    }

    return errors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setTouched({ title: true, meeting_link: true });

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('、'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === 'create') {
        const submitData = {
          title: formData.title.trim(),
          meeting_link: formData.meeting_link.trim(),
        };
        const result = await createMettingLink(submitData);
        if (result) {
          router.push('/zoom-setting');
          router.refresh();
        } else {
          throw new Error('Zoomリンクの作成に失敗しました');
        }
      } else if (mode === 'edit' && defaultValues.meeting_link_id) {
        const result = await updateMettingLink(
          defaultValues.meeting_link_id,
          formData,
        );
        if (result) {
          router.push('/zoom-setting');
          router.refresh();
        } else {
          throw new Error('Zoomリンクの更新に失敗しました');
        }
      } else {
        throw new Error('無効な操作またはIDがありません');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '不明なエラー';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    handleSubmit(e as unknown as FormEvent);
  };

  return (
    <form onSubmit={handleSubmit} className={css({ width: '100%' })}>
      {error && (
        <div
          className={css({
            padding: '0.5rem',
            marginBottom: '1rem',
            backgroundColor: 'red.100',
            color: 'red.700',
            borderRadius: 'md',
          })}
        >
          {error}
        </div>
      )}
      <div className={css({ marginBottom: '1rem' })}>
        <label htmlFor="title" className={css({ display: 'block' })}>
          名前
        </label>
        <Input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          className={
            touched.title && !formData.title.trim()
              ? css({ borderColor: 'red.500' })
              : undefined
          }
        />
        {touched.title && !formData.title.trim() && (
          <p
            className={css({
              color: 'red.500',
              fontSize: 'sm',
              marginTop: '0.5rem',
            })}
          >
            名前を入力してください
          </p>
        )}
      </div>
      <div className={css({ marginBottom: '1rem' })}>
        <label htmlFor="meeting_link" className={css({ display: 'block' })}>
          リンク
        </label>
        <Input
          type="url"
          id="meeting_link"
          name="meeting_link"
          value={formData.meeting_link}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          className={
            touched.meeting_link &&
            (!formData.meeting_link.trim() ||
              (() => {
                try {
                  new URL(formData.meeting_link);
                  return false;
                } catch (e) {
                  return true;
                }
              })())
              ? css({ borderColor: 'red.500' })
              : undefined
          }
          placeholder="https://zoom.us/j/..."
        />
        {touched.meeting_link && !formData.meeting_link.trim() && (
          <p
            className={css({
              color: 'red.500',
              fontSize: 'sm',
              marginTop: '0.5rem',
            })}
          >
            リンクを入力してください
          </p>
        )}
        {touched.meeting_link &&
          formData.meeting_link.trim() &&
          (() => {
            try {
              new URL(formData.meeting_link);
              return false;
            } catch (e) {
              return true;
            }
          })() && (
            <p
              className={css({
                color: 'red.500',
                fontSize: 'sm',
                marginTop: '0.5rem',
              })}
            >
              有効なURLを入力してください
            </p>
          )}
      </div>
      <Flex justify={'end'}>
        <ActionBtn
          type="submit"
          disabled={isSubmitting}
          onClick={handleButtonClick}
        >
          {isSubmitting ? '処理中...' : mode === 'create' ? '登録' : '更新'}
        </ActionBtn>
      </Flex>
    </form>
  );
};

export const Input = ({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cx(inputStyle, className)} {...props} />
);
