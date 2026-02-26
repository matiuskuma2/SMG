'use client';

import { saveQuestionManual } from '@/lib/api/questionManual';
import { css } from '@/styled-system/css';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RichTextEditor } from '../ui/RichTextEditor';

type QuestionManualClientProps = {
  initialData: {
    question_manual_id: string | null;
    description: string;
  };
};

export const QuestionManualClient = ({
  initialData,
}: QuestionManualClientProps) => {
  const router = useRouter();
  const [description, setDescription] = useState(initialData.description);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);

  const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4MB
  const contentSizeBytes = new Blob([description]).size;
  const isOverLimit = contentSizeBytes > MAX_SIZE_BYTES;

  const handleSave = async () => {
    if (isOverLimit) {
      setMessage({
        type: 'error',
        text: 'コンテンツサイズが4MBを超えています。画像を減らすか、サイズを小さくしてください。',
      });
      return;
    }
    setIsSaving(true);
    setMessage(null);

    try {
      await saveQuestionManual(
        description,
        initialData.question_manual_id || undefined,
      );
      setMessage({ type: 'success', text: '保存しました' });
      router.refresh();
    } catch (error) {
      console.error('保存エラー:', error);
      setMessage({ type: 'error', text: '保存に失敗しました' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={css({
        p: { base: '2', xl: '8' },
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
          p: 6,
        })}
      >
        <h1
          className={css({
            fontSize: '2xl',
            fontWeight: 'bold',
            mb: 6,
            borderBottom: '1px solid',
            borderColor: 'gray.200',
            pb: 4,
          })}
        >
          質問の使い方
        </h1>

        <div className={css({ mb: 6 })}>
          <span
            className={css({
              display: 'block',
              mb: 2,
              fontWeight: 'medium',
            })}
          >
            説明文
          </span>
          <RichTextEditor
            name="description"
            value={description}
            onChange={setDescription}
            placeholder="質問機能の使い方を入力してください..."
          />
        </div>

        {isOverLimit && (
          <div
            className={css({
              mb: 4,
              p: 3,
              rounded: 'md',
              bg: 'red.50',
              color: 'red.700',
            })}
          >
            コンテンツサイズが4MBを超えています（現在:
            {(contentSizeBytes / 1024 / 1024).toFixed(2)}
            MB）。画像を減らすか、サイズを小さくしてください。
          </div>
        )}

        {message && (
          <div
            className={css({
              mb: 4,
              p: 3,
              rounded: 'md',
              bg: message.type === 'success' ? 'green.50' : 'red.50',
              color: message.type === 'success' ? 'green.700' : 'red.700',
            })}
          >
            {message.text}
          </div>
        )}

        <div className={css({ display: 'flex', justifyContent: 'flex-end' })}>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isOverLimit}
            className={css({
              px: 6,
              py: 2,
              bg: isSaving || isOverLimit ? 'gray.400' : 'blue.500',
              color: 'white',
              rounded: 'md',
              fontWeight: 'medium',
              cursor: isSaving || isOverLimit ? 'not-allowed' : 'pointer',
              _hover: {
                bg: isSaving || isOverLimit ? 'gray.400' : 'blue.600',
              },
            })}
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};
