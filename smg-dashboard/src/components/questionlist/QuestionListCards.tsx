import { Button } from '@/components/ui/button';
import { css, cx } from '@/styled-system/css';
import { formatIsoDate } from '@/utils/date';
import Link from 'next/link';
import type React from 'react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import type { FilterType, Question } from './QuestionTypes';

interface QuestionListCardsProps {
  questions: Question[];
  filterType: FilterType;
  toggleVisibility: (id: string) => void;
}

export const QuestionListCards: React.FC<QuestionListCardsProps> = ({
  questions,
  filterType,
  toggleVisibility,
}) => {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const confirmAndToggle = () => {
    if (confirmId) {
      toggleVisibility(confirmId);
      setConfirmId(null);
    }
  };

  return (
    <>
      <div
        className={css({
          display: { base: 'block', xl: 'none' },
          p: '4',
        })}
      >
        {questions.map((q) => (
          <div
            key={q.question_id}
            className={css({
              bg: 'white',
              border: '1px solid',
              borderColor: 'gray.200',
              rounded: 'md',
              mb: '4',
              overflow: 'hidden',
            })}
          >
            <div
              className={css({
                p: '4',
                borderBottom: '1px solid',
                borderColor: 'gray.200',
                bg: 'gray.50',
              })}
            >
              <div
                className={css({
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: '2',
                })}
              >
                <div
                  className={css({
                    fontSize: 'lg',
                    fontWeight: 'bold',
                    color: 'blue.700',
                  })}
                >
                  質問
                </div>
                <div className={css({ fontSize: 'sm', color: 'gray.500' })}>
                  {q.created_at ? formatIsoDate(q.created_at) : ''}
                </div>
              </div>
              <div className={css({ fontWeight: 'medium', mb: '1' })}>
                質問者: {q.user_name}
              </div>
              <div className={css({ mb: '1' })}>講師: {q.instructor_name}</div>
            </div>

            <div className={css({ p: '4' })}>
              <div className={css({ mb: '4' })}>
                <div
                  className={css({
                    fontWeight: 'bold',
                    mb: '1',
                    color: 'gray.700',
                  })}
                >
                  質問内容:
                </div>
                <div
                  className={css({
                    bg: 'gray.50',
                    p: '3',
                    rounded: 'md',
                    fontSize: 'sm',
                  })}
                >
                  {q.content}
                </div>
              </div>

              <div className={css({ mb: '4' })}>
                <div
                  className={css({
                    fontWeight: 'bold',
                    mb: '1',
                    color: 'gray.700',
                  })}
                >
                  回答内容:
                </div>
                <div
                  className={css({
                    bg: 'gray.50',
                    p: '3',
                    rounded: 'md',
                    fontSize: 'sm',
                    color:
                      q.answer?.content && !q.answer?.is_draft
                        ? 'inherit'
                        : 'gray.500',
                    fontStyle:
                      q.answer?.content && !q.answer?.is_draft
                        ? 'normal'
                        : 'italic',
                  })}
                >
                  {q.answer?.is_draft ? (
                    <span
                      className={css({
                        color: 'gray.500',
                        fontStyle: 'italic',
                        fontWeight: 'medium',
                      })}
                    >
                      下書き中
                    </span>
                  ) : (
                    q.answer?.content || (
                      <span
                        className={css({
                          color: 'gray.500',
                          fontStyle: 'italic',
                        })}
                      >
                        未回答
                      </span>
                    )
                  )}
                </div>
              </div>

              <div
                className={css({
                  fontSize: 'sm',
                  color: 'gray.500',
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: '3',
                })}
              >
                <div>
                  回答日:{' '}
                  {q.answer?.created_at
                    ? formatIsoDate(q.answer.created_at)
                    : '未回答'}{' '}
                  {q.answer?.instructor_name
                    ? `by ${q.answer?.instructor_name}`
                    : ''}
                </div>
                <div>
                  ステータス: {q.status === 'answered' ? '回答済み' : '未回答'}
                </div>
              </div>

              <div
                className={css({
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                })}
              >
                {filterType === 'public' && (
                  <label
                    className={css({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2',
                      fontSize: 'sm',
                    })}
                  >
                    <input
                      type="checkbox"
                      checked={q.is_hidden === false}
                      onChange={() => setConfirmId(q.question_id)}
                    />
                    公開する
                  </label>
                )}

                <Link href={`/questionlist/${q.question_id}`}>
                  <Button
                    size="sm"
                    className={css({
                      bg: 'blue.600',
                      color: 'white',
                      px: '4',
                      py: '2',
                      rounded: 'md',
                      fontWeight: 'medium',
                      _hover: { bg: 'blue.700' },
                      ml: 'auto',
                    })}
                  >
                    回答する
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={!!confirmId}
        onOpenChange={(open) => !open && setConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>公開設定の変更</DialogTitle>
          </DialogHeader>
          <p>公開状態を変更してもよろしいですか？</p>
          <DialogFooter>
            <div
              className={css({
                display: 'flex',
                gap: 2,
                justifyContent: 'flex-end',
              })}
            >
              <Button
                onClick={() => setConfirmId(null)}
                className={css({
                  width: { base: '100%', sm: 'auto' },
                  bg: 'gray.200',
                  color: 'gray.800',
                  borderColor: 'gray.300',
                  _hover: {
                    bg: 'gray.300',
                  },
                  fontWeight: 'medium',
                  px: 4,
                  py: 2,
                  borderRadius: 'md',
                })}
              >
                キャンセル
              </Button>

              <Button
                onClick={confirmAndToggle}
                className={css({
                  width: { base: '100%', sm: 'auto' },
                  bg: 'blue.600',
                  color: 'white',
                  borderColor: 'blue.600',
                  _hover: {
                    bg: 'blue.700',
                    borderColor: 'blue.700',
                  },
                  fontWeight: 'medium',
                  px: 4,
                  py: 2,
                  borderRadius: 'md',
                })}
              >
                はい
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const iconButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: '2',
  py: '2',
  borderRadius: 'md',
  cursor: 'pointer',
  width: '32px',
  height: '32px',
  color: 'white',
  _hover: { color: 'white' },
});

const Detail = ({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) => (
  <div
    className={css({
      display: 'grid',
      gridTemplateColumns: '100px 1fr',
      gap: '1',
      mb: '1',
      fontSize: 'sm',
      alignItems: 'center',
    })}
  >
    <div className={css({ color: 'gray.600' })}>{label}:</div>
    <div>{value}</div>
  </div>
);
