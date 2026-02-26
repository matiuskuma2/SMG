'use client';

import type {
  DbAnswer,
  Question,
} from '@/components/questionlist/QuestionTypes';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { RichTextViewer } from '@/components/ui/RichTextViewer';
import { Button } from '@/components/ui/button';
import {
  getAnswerForQuestion,
  getQuestionById,
  saveAnswerApi,
} from '@/lib/api/questions';
import { revalidateQuestion } from '@/lib/api/revalidate';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import { formatIsoDate } from '@/utils/date';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

interface QuestionDetailPageProps {
  params: { id: string };
}

export default function QuestionDetailPage({
  params,
}: QuestionDetailPageProps) {
  const router = useRouter();
  const [question, setQuestion] = React.useState<Question | null>(null);
  const [answerText, setAnswerText] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [existingAnswer, setExistingAnswer] = React.useState<DbAnswer | null>(
    null,
  );
  const [isDraft, setIsDraft] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // 質問データと回答を取得
  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 質問データを取得
        const questionData = await getQuestionById(params.id);
        if (!questionData) {
          setError('質問が見つかりません');
          return;
        }
        setQuestion(questionData);

        // 既存の回答を取得
        const answers = await getAnswerForQuestion(params.id);
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
        console.error('データの取得に失敗しました:', error);
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const handleSubmit = async () => {
    if (!question || !answerText.trim()) return;

    setIsSubmitting(true);
    try {
      await saveAnswerApi({
        question_id: question.question_id,
        instructor_id: question.instructor_id,
        content: answerText,
        is_draft: false,
      });

      // キャッシュを再検証
      await revalidateQuestion();

      alert('回答を公開しました');
      router.push('/questionlist');
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
      await saveAnswerApi({
        question_id: question.question_id,
        instructor_id: question.instructor_id,
        content: answerText,
        is_draft: true,
      });

      // キャッシュを再検証
      await revalidateQuestion();

      alert('下書きを保存しました');
      router.push('/questionlist');
    } catch (error) {
      console.error('下書きの保存に失敗しました:', error);
      alert('下書きの保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={css({ p: 8, textAlign: 'center' })}>読み込み中...</div>
    );
  }

  if (error) {
    return (
      <div className={css({ p: 8, textAlign: 'center', color: 'red.600' })}>
        {error}
        <div className={css({ mt: 4 })}>
          <Link href="/questionlist">
            <Button>質問リストに戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className={css({ p: 8, textAlign: 'center' })}>
        質問が見つかりません
      </div>
    );
  }

  return (
    <div className={css({ p: { base: 4, sm: 6, md: 8 }, minH: '100vh' })}>
      <div className={css({ maxW: '4xl', mx: 'auto' })}>
        {/* ヘッダー部分 */}
        <div
          className={css({
            mb: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          })}
        >
          <Link href="/questionlist">
            <Button
              variant="outline"
              size="sm"
              className={css({ display: 'flex', alignItems: 'center', gap: 2 })}
            >
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <h1
            className={css({
              fontSize: '2xl',
              fontWeight: 'bold',
              color: 'gray.800',
            })}
          >
            質問確認・回答
          </h1>
        </div>

        <div
          className={css({
            bg: 'white',
            rounded: 'lg',
            shadow: 'sm',
            overflow: 'hidden',
          })}
        >
          {/* 質問詳細セクション */}
          <div
            className={css({
              p: 6,
              borderBottom: '1px solid',
              borderColor: 'gray.200',
            })}
          >
            <h2
              className={css({
                fontSize: 'lg',
                fontWeight: 'bold',
                mb: 4,
                color: 'gray.800',
              })}
            >
              質問詳細
            </h2>
            <div className={css({ display: 'grid', gap: 4, fontSize: 'sm' })}>
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
                  gridTemplateColumns: '120px 1fr',
                  gap: 4,
                  alignItems: 'flex-start',
                })}
              >
                <div
                  className={css({
                    color: 'gray.600',
                    fontWeight: 'medium',
                    paddingTop: '12px',
                  })}
                >
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

          {/* 回答セクション */}
          <div className={css({ p: 6 })}>
            <h2
              className={css({
                fontSize: 'lg',
                fontWeight: 'bold',
                mb: 4,
                color: 'gray.800',
              })}
            >
              回答内容
            </h2>
            <RichTextEditor
              value={answerText}
              onChange={setAnswerText}
              placeholder="ここに回答を入力してください"
              disabled={isSubmitting}
            />

            {/* ボタン部分 */}
            <div
              className={css({
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 3,
                mt: 6,
                flexWrap: 'wrap',
              })}
            >
              <Button
                type="button"
                onClick={handleSaveDraft}
                disabled={!answerText.trim() || isSubmitting}
                className={css({
                  px: 6,
                  py: 2,
                  bg: 'gray.500',
                  color: 'white',
                  _hover: { bg: 'gray.600' },
                  opacity: !answerText.trim() || isSubmitting ? 0.6 : 1,
                })}
              >
                {isSubmitting ? '保存中...' : '下書き保存'}
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!answerText.trim() || isSubmitting}
                className={css({
                  px: 6,
                  py: 2,
                  bg: 'blue.600',
                  color: 'white',
                  _hover: { bg: 'blue.700' },
                  opacity: !answerText.trim() || isSubmitting ? 0.6 : 1,
                })}
              >
                {isSubmitting
                  ? '送信中...'
                  : existingAnswer?.is_draft
                    ? '公開する'
                    : '回答する'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Detail = ({
  label,
  value,
}: { label: string; value: string | null | undefined }) => (
  <div
    className={css({
      display: 'grid',
      gridTemplateColumns: '120px 1fr',
      gap: 4,
      alignItems: 'center',
    })}
  >
    <div className={css({ color: 'gray.600', fontWeight: 'medium' })}>
      {label}:
    </div>
    <div className={css({ wordWrap: 'break-word' })}>{value || '-'}</div>
  </div>
);
