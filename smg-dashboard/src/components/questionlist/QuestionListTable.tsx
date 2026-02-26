import { Button } from '@/components/ui/button';
import { css, cx } from '@/styled-system/css';
import { formatIsoDate } from '@/utils/date';
import Link from 'next/link';
import type React from 'react';
import { useState } from 'react';
import { FaPen } from 'react-icons/fa';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import type { Question } from './QuestionTypes';

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

const ellipsisText = css({
  py: '3',
  px: '4',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxW: '200px',
});

interface QuestionListTableProps {
  questions: Question[];
  filterType: 'public' | 'anonymous';
  toggleVisibility: (id: string) => void;
}

export const QuestionListTable: React.FC<QuestionListTableProps> = ({
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
          display: { base: 'none', xl: 'block' },
          overflowX: 'auto',
        })}
      >
        <table
          className={css({
            w: 'full',
            borderCollapse: 'collapse',
            textAlign: 'left',
          })}
        >
          <thead>
            <tr
              className={css({
                bg: 'gray.50',
                borderBottom: '2px solid',
                borderColor: 'gray.200',
              })}
            >
              <th className={headerStyle}>質問日</th>
              <th className={headerStyle}>質問者</th>
              <th className={headerStyle}>質問</th>
              <th className={headerStyle}>回答</th>
              <th className={headerStyle}>担当講師</th>
              <th className={headerStyle}>回答日</th>
              <th className={headerStyle}>回答者</th>
              {filterType === 'public' && <th className={headerStyle}>公開</th>}
              <th className={headerStyle}>アクション</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr
                key={q.question_id}
                className={css({
                  borderBottom: '1px solid',
                  borderColor: 'gray.200',
                  _hover: { bg: 'gray.50' },
                })}
              >
                <td className={cellStyle}>
                  {q.created_at ? formatIsoDate(q.created_at) : ''}
                </td>
                <td className={cellStyle}>{q.user_name}</td>
                <td className={ellipsisText}>{q.content}</td>
                <td className={ellipsisText}>
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
                </td>
                <td className={cellStyle}>{q.instructor_name}</td>
                <td className={cellStyle}>
                  {q.answer?.created_at
                    ? formatIsoDate(q.answer.created_at)
                    : ''}
                </td>
                <td className={cellStyle}>{q.answer?.instructor_name}</td>
                {filterType === 'public' && (
                  <td className={cellStyle}>
                    <input
                      type="checkbox"
                      checked={q.is_hidden === false}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => setConfirmId(q.question_id)}
                    />
                  </td>
                )}
                <td
                  className={css({
                    py: '3',
                    px: '4',
                    display: 'flex',
                    gap: '2',
                  })}
                >
                  <Link href={`/questionlist/${q.question_id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label="回答する"
                      className={cx(
                        iconButtonStyle,
                        css({
                          bg: 'blue.400',
                          borderColor: 'blue.600',
                          _hover: { bg: 'blue.700' },
                        }),
                      )}
                    >
                      <FaPen size={14} />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

const headerStyle = css({
  py: '3',
  px: '4',
  fontWeight: 'semibold',
  color: 'gray.700',
  minW: '120px',
});

const cellStyle = css({ py: '3', px: '4' });
