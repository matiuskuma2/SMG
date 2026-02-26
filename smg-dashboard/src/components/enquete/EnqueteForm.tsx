'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { css } from '../../../styled-system/css';
import { AddQuestionButtons } from './AddQuestionButtons';
import { QuestionItem } from './QuestionItem';
import {
  type EnqueteFormData,
  type QuestionItem as QuestionItemType,
  QuestionType,
} from './types';

interface EnqueteFormProps {
  initialData?: EnqueteFormData;
  onSubmit: (data: EnqueteFormData) => void;
  onCancel?: () => void;
  submitButtonText?: string;
}

export function EnqueteForm({
  initialData,
  onSubmit,
  onCancel,
  submitButtonText = '作成',
}: EnqueteFormProps) {
  const router = useRouter();
  const [formTitle, setFormTitle] = useState(
    initialData?.title || '無題のフォーム',
  );
  const [formDescription, setFormDescription] = useState(
    initialData?.description || '',
  );
  const [questions, setQuestions] = useState<QuestionItemType[]>(
    initialData?.questions || [
      {
        id: 'q1',
        type: QuestionType.MultipleChoice,
        title: '無題の質問',
        options: ['オプション1', 'オプション2', 'その他...'],
        required: false,
      },
    ],
  );

  // 新しい質問を追加
  const addQuestion = (type: QuestionType) => {
    const newQuestion: QuestionItemType = {
      id: `q${Date.now()}`,
      type,
      title: '質問',
      required: false,
    };

    if (type === QuestionType.MultipleChoice) {
      newQuestion.options = ['選択肢1'];
    }

    setQuestions([...questions, newQuestion]);
  };

  // 質問を削除
  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  // 質問タイトルを更新
  const updateQuestionTitle = (id: string, title: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, title } : q)));
  };

  // 選択肢を更新
  const updateOption = (
    questionId: string,
    optionIndex: number,
    value: string,
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.options) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      }),
    );
  };

  // 選択肢を追加
  const addOption = (questionId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.options) {
          return {
            ...q,
            options: [...q.options, `選択肢${q.options.length + 1}`],
          };
        }
        return q;
      }),
    );
  };

  // 選択肢を削除
  const deleteOption = (questionId: string, optionIndex: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.options && q.options.length > 1) {
          const newOptions = q.options.filter((_, i) => i !== optionIndex);
          return { ...q, options: newOptions };
        }
        return q;
      }),
    );
  };

  // 質問の必須設定を切り替え
  const toggleRequired = (id: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === id) {
          return { ...q, required: !q.required };
        }
        return q;
      }),
    );
  };

  // キャンセル処理
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  // フォームを送信
  const handleSubmit = () => {
    const formData: EnqueteFormData = {
      title: formTitle,
      description: formDescription,
      questions: questions,
    };
    onSubmit(formData);
  };

  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        minHeight: '100vh',
      })}
    >
      <div
        className={css({
          width: '100%',
          maxWidth: '800px',
          padding: { base: '2', md: '4' },
        })}
      >
        <div
          className={css({
            width: '100%',
            maxWidth: '3xl',
            marginX: 'auto',
            paddingX: { base: '2', md: '4' },
            paddingY: '4',
            display: 'flex',
            flexDirection: 'column',
            gap: '4',
          })}
        >
          {/* フォームのヘッダー */}
          <div
            className={css({
              border: '1px solid',
              borderColor: 'gray.200',
              borderTopWidth: '8px',
              borderTopColor: '#254860',
              borderRadius: 'md',
              padding: { base: '4', md: '6' },
              bg: 'white',
              boxShadow: 'sm',
            })}
          >
            <Input
              value={formTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormTitle(e.target.value)
              }
              className={css({
                fontSize: { base: 'xl', md: '2xl' },
                fontWeight: 'bold',
                border: 'none',
                outline: 'none',
                padding: '0',
                width: 'full',
                _focus: { ring: '0' },
              })}
            />
            <textarea
              value={formDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormDescription(e.target.value)
              }
              className={css({
                width: 'full',
                border: 'none',
                resize: 'none',
                outline: 'none',
                padding: '0',
                marginTop: '6',
                _focus: { ring: '0' },
              })}
              placeholder="フォームの説明"
            />
          </div>

          {/* 質問リスト */}
          <div className={css({ marginTop: '2' })}>
            {questions.map((question) => (
              <QuestionItem
                key={question.id}
                question={question}
                updateQuestionTitle={updateQuestionTitle}
                updateOption={updateOption}
                addOption={addOption}
                deleteOption={deleteOption}
                toggleRequired={toggleRequired}
                deleteQuestion={deleteQuestion}
              />
            ))}
          </div>

          {/* 新しい質問を追加するボタン */}
          <AddQuestionButtons addQuestion={addQuestion} />

          {/* アクションボタン */}
          <div
            className={css({
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '4',
              marginBottom: '8',
              gap: '4',
            })}
          >
            <Button
              onClick={handleCancel}
              className={css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2',
                padding: { base: '2 6', md: '3 8' },
                bg: 'gray.200',
                color: 'gray.700',
                fontSize: { base: 'md', md: 'lg' },
                fontWeight: 'semibold',
                borderRadius: 'lg',
                boxShadow:
                  '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                _hover: {
                  bg: 'gray.300',
                  transform: 'translateY(-1px)',
                  boxShadow:
                    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
                transition: 'all 0.2s ease-in-out',
                minWidth: { base: '100px', md: '120px' },
                height: { base: '40px', md: '48px' },
                cursor: 'pointer',
              })}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSubmit}
              className={css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2',
                padding: { base: '2 6', md: '3 8' },
                bg: '#254860',
                color: 'white',
                fontSize: { base: 'md', md: 'lg' },
                fontWeight: 'semibold',
                borderRadius: 'lg',
                boxShadow:
                  '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                _hover: {
                  bg: '#1a3545',
                  transform: 'translateY(-1px)',
                  boxShadow:
                    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
                transition: 'all 0.2s ease-in-out',
                minWidth: { base: '100px', md: '120px' },
                height: { base: '40px', md: '48px' },
                cursor: 'pointer',
              })}
            >
              {submitButtonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
