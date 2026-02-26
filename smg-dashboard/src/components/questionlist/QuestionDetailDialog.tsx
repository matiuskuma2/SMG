'use client';

import type {
  DbAnswer,
  Question,
} from '@/components/questionlist/QuestionTypes';
import { Button } from '@/components/ui/button';
import {
  getAnswerForQuestion,
  saveAnswer,
  saveAnswerApi,
} from '@/lib/api/questions';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import { formatIsoDate } from '@/utils/date';
import * as React from 'react';
import { RichTextEditor } from '../ui/RichTextEditor';
import { RichTextViewer } from '../ui/RichTextViewer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
interface QuestionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question | null;
  onAnswerUpdate?: (
    questionId: string,
    isDraft: boolean,
    content: string,
    instructorName: string,
  ) => void;
}

export const QuestionDetailDialog: React.FC<QuestionDetailDialogProps> = ({
  open,
  onOpenChange,
  question,
  onAnswerUpdate,
}) => {
  const [answerText, setAnswerText] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [existingAnswer, setExistingAnswer] = React.useState<DbAnswer | null>(
    null,
  );
  const [isDraft, setIsDraft] = React.useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showGradient, setShowGradient] = React.useState(false);

  const handleScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isScrollable = el.scrollHeight > el.clientHeight;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    setShowGradient(isScrollable && !atBottom);
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    handleScroll();
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // 質問が変更された時に回答を取得
  React.useEffect(() => {
    if (open && question) {
      setIsSubmitting(false);

      // 既存の回答を取得
      const fetchAnswer = async () => {
        try {
          const answers = await getAnswerForQuestion(question.question_id);
          if (answers && answers.length > 0) {
            setExistingAnswer(answers[0]);
            setAnswerText(answers[0].content);
            setIsDraft(answers[0].is_draft ?? true);
          } else {
            setExistingAnswer(null);
            setAnswerText('');
            setIsDraft(true);
          }
        } catch (error) {
          console.error('回答の取得に失敗しました:', error);
          setExistingAnswer(null);
          setAnswerText('');
          setIsDraft(true);
        }
      };

      fetchAnswer();
    }
  }, [open, question]);

  if (!question) return null;

  // 現在ログイン中の講師のIDを取得
  const getCurrentInstructor = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw new Error('Not authenticated');
    }

    // ユーザー情報を取得
    const { data: userData, error } = await supabase
      .from('mst_user')
      .select('username')
      .eq('user_id', data.session.user.id)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('ユーザー情報の取得に失敗:', error);
    }

    return {
      id: data.session.user.id,
      name: userData?.username || '不明なユーザー',
    };
  };

  const handleSubmit = async () => {
    if (!question || !answerText.trim()) return;

    setIsSubmitting(true);
    try {
      // 担当講師のIDを使用
      await saveAnswerApi({
        question_id: question.question_id,
        instructor_id: question.instructor_id,
        content: answerText,
        is_draft: false,
      });

      // 親コンポーネントに通知して一覧を更新
      if (onAnswerUpdate) {
        // サーバーサイドでは講師IDに紐づく名前が設定されるため、
        // 担当講師名をそのまま使用する
        onAnswerUpdate(
          question.question_id,
          false,
          answerText,
          question.instructor_name || '不明な講師',
        );
      }

      // ダイアログを閉じる
      onOpenChange(false);
    } catch (error) {
      console.error('回答の保存に失敗しました:', error);
      alert('回答の保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!question || !answerText.trim()) return;

    setIsSubmitting(true);
    try {
      // 担当講師のIDを使用
      await saveAnswerApi({
        question_id: question.question_id,
        instructor_id: question.instructor_id,
        content: answerText,
        is_draft: true,
      });

      // 親コンポーネントに通知して一覧を更新
      if (onAnswerUpdate) {
        // サーバーサイドでは講師IDに紐づく名前が設定されるため、
        // 担当講師名をそのまま使用する
        onAnswerUpdate(
          question.question_id,
          true,
          answerText,
          question.instructor_name || '不明な講師',
        );
      }

      // ダイアログを閉じる
      onOpenChange(false);
      alert('下書きを保存しました');
    } catch (error) {
      console.error('下書きの保存に失敗しました:', error);
      alert('下書きの保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClick={(e) => e.stopPropagation()}
        className={css({
          maxHeight: '90vh',
          overflowY: 'auto',
          p: { base: 4, sm: 6 },
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          width: 'full',
          maxWidth: { base: '90%', sm: '4xl' },
          borderRadius: { base: 'md', sm: 'lg' },
        })}
      >
        <DialogHeader>
          <DialogTitle className={css({ fontSize: 'xl' })}>
            質問確認・回答
          </DialogTitle>
          <DialogDescription className={css({ mb: 2, color: 'gray.500' })}>
            以下の質問内容をご確認の上、回答を記入してください。
          </DialogDescription>
        </DialogHeader>

        <div className={css({ position: 'relative' })}>
          <div
            ref={scrollRef}
            className={css({
              flexGrow: 1,
              overflowY: 'auto',
              maxHeight: '40vh',
              pr: 2,
            })}
          >
            <div className={css({ display: 'grid', gap: 3, fontSize: 'sm' })}>
              <Detail
                label="質問日"
                value={
                  question.created_at ? formatIsoDate(question.created_at) : ''
                }
              />
              <Detail label="質問者" value={question.user_name} />

              {/* 質問内容をリッチテキストビューワーで表示 */}
              <div
                className={css({
                  display: 'grid',
                  gridTemplateColumns: '100px 1fr',
                  gap: '1',
                  mb: '1',
                  fontSize: 'sm',
                  alignItems: 'flex-start',
                })}
              >
                <div className={css({ color: 'gray.600', paddingTop: '12px' })}>
                  質問内容:
                </div>
                <div>
                  <RichTextViewer
                    value={question.content || ''}
                    className={css({ maxWidth: '100%' })}
                  />
                </div>
              </div>

              <Detail label="質問先の講師名" value={question.instructor_name} />
              <Detail
                label="強制非表示"
                value={question.is_hidden ? 'はい' : 'いいえ'}
              />
              <Detail
                label="回答ステータス"
                value={
                  existingAnswer?.is_draft
                    ? '下書き中'
                    : question.status === 'answered'
                      ? '回答済み'
                      : '未回答'
                }
              />
              <Detail
                label="非公開"
                value={question.is_anonymous ? 'はい' : 'いいえ'}
              />
              {existingAnswer?.is_draft && (
                <Detail label="下書き状態" value="この回答は下書き状態です" />
              )}
            </div>
          </div>
          {showGradient && (
            <div
              className={css({
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '40px',
                background: 'linear-gradient(to bottom, transparent, white)',
                pointerEvents: 'none',
              })}
            />
          )}
        </div>

        <div>
          <label
            htmlFor="answerTextArea"
            className={css({ fontWeight: 'bold', display: 'block', mb: 1 })}
          >
            回答内容
          </label>
          <RichTextEditor
            value={answerText}
            onChange={setAnswerText}
            placeholder="ここに回答を入力してください"
            disabled={isSubmitting}
          />
        </div>

        <DialogFooter
          className={css({
            display: 'flex',
            justifyContent: 'flex-end',
            mt: 4,
          })}
        >
          <div
            className={css({
              display: 'flex',
              flexDirection: 'row',
              gap: 3,
              flexWrap: 'nowrap',
              justifyContent: 'center',
            })}
          >
            <Button
              type="button"
              onClick={handleSaveDraft}
              disabled={!answerText.trim() || isSubmitting}
              className={css({
                bg: 'gray.100',
                color: 'gray.800',
                _hover: { bg: 'gray.200' },
                px: 5,
                py: 2,
                borderRadius: 'md',
                fontWeight: 'medium',
                opacity: !answerText.trim() || isSubmitting ? 0.6 : 1,
                cursor:
                  !answerText.trim() || isSubmitting
                    ? 'not-allowed'
                    : 'pointer',
              })}
            >
              {isSubmitting ? '保存中...' : '下書き保存'}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!answerText.trim() || isSubmitting}
              className={css({
                bg: 'blue.600',
                color: 'white',
                _hover: { bg: 'blue.700' },
                px: 5,
                py: 2,
                borderRadius: 'md',
                fontWeight: 'medium',
                opacity: !answerText.trim() || isSubmitting ? 0.6 : 1,
                cursor:
                  !answerText.trim() || isSubmitting
                    ? 'not-allowed'
                    : 'pointer',
              })}
            >
              {isSubmitting
                ? '送信中...'
                : existingAnswer?.is_draft
                  ? '公開する'
                  : '回答する'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Detail = ({
  label,
  value,
}: { label: string; value: string | null | undefined }) => (
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
    <div>{value || '-'}</div>
  </div>
);
