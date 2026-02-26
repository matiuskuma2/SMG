'use client';

import { Button } from '@/components/ui/button';
import { css } from '@/styled-system/css';
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import type { EventQuestionAnswerWithQuestion } from './types';
import type { Participant } from './types';

interface EventParticipantDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participant: Participant | null;
  eventId?: string;
}

export const EventParticipantDetailDialog: React.FC<
  EventParticipantDetailDialogProps
> = ({ open, onOpenChange, participant, eventId }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showGradient, setShowGradient] = React.useState(false);
  const [answers, setAnswers] = React.useState<
    EventQuestionAnswerWithQuestion[]
  >([]);
  const [loadingAnswers, setLoadingAnswers] = React.useState(false);

  // 質問回答を取得
  const fetchAnswers = React.useCallback(
    async (userId: string, eventId?: string) => {
      try {
        setLoadingAnswers(true);
        console.log('=== FETCHING EVENT ANSWERS DEBUG ===');
        console.log('Fetching answers for user_id:', userId);
        console.log('Event ID:', eventId);
        console.log('User ID type:', typeof userId);

        const queryParams = new URLSearchParams({ user_id: userId });
        if (eventId) {
          queryParams.append('event_id', eventId);
        }

        const url = `/api/event-question-answers?${queryParams.toString()}`;
        console.log('Full API URL:', url);

        const response = await fetch(url);
        if (!response.ok) throw new Error('回答の取得に失敗しました');
        const data = await response.json();
        console.log('=== EVENT API RESPONSE DEBUG ===');
        console.log('Response status:', response.status);
        console.log(
          'Response headers:',
          Object.fromEntries(response.headers.entries()),
        );
        console.log('API response data:', data);
        console.log('Number of answers:', data.answers?.length || 0);
        setAnswers(data.answers || []);
      } catch (error) {
        console.error('回答取得エラー:', error);
        setAnswers([]);
      } finally {
        setLoadingAnswers(false);
      }
    },
    [],
  );

  const handleScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isScrollable = el.scrollHeight > el.clientHeight;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
    setShowGradient(isScrollable && !atBottom);
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    handleScroll();
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // 参加者が変更された時に回答を取得
  React.useEffect(() => {
    if (participant?.userId && open) {
      console.log('=== EVENT PARTICIPANT DEBUG ===');
      console.log('Full participant object:', participant);
      console.log('Fetching answers for participant:', {
        userId: participant.userId,
        eventId: eventId,
        userName: participant.name,
        userIdType: typeof participant.userId,
      });
      fetchAnswers(participant.userId, eventId);
    }
  }, [participant, open, eventId, fetchAnswers]);

  if (!participant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className={css({
          maxHeight: '90vh',
          overflowY: 'hidden',
          p: { base: 4, sm: 6 },
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          width: 'full',
          maxWidth: { base: '100%', sm: 'xl' },
          borderRadius: { base: 'md', sm: 'lg' },
        })}
      >
        <DialogHeader>
          <DialogTitle className={css({ fontSize: 'xl' })}>
            参加者詳細
          </DialogTitle>
          <DialogDescription className={css({ mb: 2, color: 'gray.500' })}>
            以下は参加者の情報です。
          </DialogDescription>
        </DialogHeader>

        <div className={css({ position: 'relative' })}>
          <div
            ref={scrollRef}
            className={css({
              flexGrow: 1,
              overflowY: 'auto',
              maxHeight: '60vh',
              pr: 2,
            })}
          >
            <div
              className={css({
                display: 'grid',
                gap: 3,
                fontSize: 'sm',
                py: 4,
              })}
            >
              <Detail label="名前" value={participant.name} />
              <Detail label="会社名" value={participant.companyName || ''} />
              <Detail label="メールアドレス" value={participant.email} />
              <Detail label="電話番号" value={participant.phone || ''} />
              <Detail label="ユーザー種別" value={participant.userType || ''} />
              <GroupAffiliationDetail participant={participant} />

              {/* 質問回答セクション */}
              {loadingAnswers ? (
                <div
                  className={css({
                    textAlign: 'center',
                    py: 4,
                    color: 'gray.500',
                  })}
                >
                  回答を読み込み中...
                </div>
              ) : (
                <div
                  className={css({
                    mt: 4,
                    pt: 4,
                    borderTop: '1px solid',
                    borderColor: 'gray.200',
                  })}
                >
                  <h4
                    className={css({
                      fontWeight: 'bold',
                      color: 'gray.700',
                      mb: 3,
                      fontSize: 'sm',
                    })}
                  >
                    申込時質問への回答
                  </h4>
                  {answers.length > 0 ? (
                    <div className={css({ display: 'grid', gap: 3 })}>
                      {answers
                        .map((answerData) => {
                          if (!answerData.trn_event_question) {
                            console.warn(
                              'Missing question data for answer:',
                              answerData,
                            );
                            return null;
                          }
                          return (
                            <QuestionAnswer
                              key={answerData.answer_id}
                              questionData={answerData.trn_event_question}
                              answer={answerData.answer}
                            />
                          );
                        })
                        .filter(Boolean)}
                    </div>
                  ) : (
                    <div
                      className={css({
                        textAlign: 'center',
                        py: 4,
                        color: 'gray.500',
                        fontStyle: 'italic',
                      })}
                    >
                      申込時質問への回答はありません
                    </div>
                  )}
                </div>
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

        <DialogFooter
          className={css({
            display: 'flex',
            justifyContent: 'flex-end',
            mt: 4,
          })}
        >
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className={css({
              bg: 'blue.600',
              color: 'white',
              _hover: { bg: 'blue.700' },
              px: 5,
              py: 2,
              borderRadius: 'md',
              fontWeight: 'medium',
            })}
          >
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div
    className={css({
      display: 'flex',
      flexDirection: { base: 'column', sm: 'row' },
      gap: 1,
      fontSize: 'sm',
      wordBreak: 'break-word',
      whiteSpace: 'pre-line',
    })}
  >
    <span
      className={css({
        fontWeight: 'bold',
        color: 'gray.600',
        minWidth: { sm: '120px' },
      })}
    >
      {label}：
    </span>
    <span>{value}</span>
  </div>
);

// 複数グループ表示用のコンポーネント
const GroupAffiliationDetail = ({
  participant,
}: { participant: Participant }) => {
  const groupAffiliations = participant.groupAffiliations;

  if (!groupAffiliations || groupAffiliations.length === 0) {
    return <Detail label="所属グループ" value="未所属" />;
  }

  if (groupAffiliations.length === 1) {
    return <Detail label="所属グループ" value={groupAffiliations[0]} />;
  }

  return (
    <div
      className={css({
        display: 'flex',
        flexDirection: { base: 'column', sm: 'row' },
        gap: 1,
        fontSize: 'sm',
        wordBreak: 'break-word',
      })}
    >
      <span
        className={css({
          fontWeight: 'bold',
          color: 'gray.600',
          minWidth: { sm: '120px' },
        })}
      >
        所属グループ：
      </span>
      <div className={css({ display: 'flex', flexWrap: 'wrap', gap: 1 })}>
        {groupAffiliations.map((group) => (
          <span
            key={group}
            className={css({
              bg: 'blue.100',
              color: 'blue.800',
              px: 2,
              py: 1,
              borderRadius: 'md',
              fontSize: 'sm',
            })}
          >
            {group}
          </span>
        ))}
      </div>
    </div>
  );
};

// 質問回答表示コンポーネント
const QuestionAnswer = ({
  questionData,
  answer,
}: {
  questionData: {
    question_id: string;
    title: string;
    question_type: string;
    options: string[] | Record<string, string> | null;
    is_required: boolean;
    display_order?: number;
  };
  answer:
    | string
    | boolean
    | string[]
    | number
    | {
        text?: string;
        value?: string | number | boolean;
        boolean?: boolean;
        selected?: string[];
      }
    | null;
}) => {
  const formatEventAnswer = () => {
    if (answer === null || answer === undefined || answer === '') {
      return '（未回答）';
    }

    let formattedAnswer = '';

    switch (questionData.question_type) {
      case 'text':
        if (typeof answer === 'string') {
          formattedAnswer = answer;
        } else if (typeof answer === 'object' && answer !== null) {
          const answerObj = answer as {
            text?: string;
            value?: string | number | boolean;
          };
          formattedAnswer =
            answerObj.text ||
            (answerObj.value !== undefined ? String(answerObj.value) : '') ||
            JSON.stringify(answer);
        } else {
          formattedAnswer = String(answer);
        }
        break;

      case 'boolean': {
        let boolValue: boolean;
        if (typeof answer === 'boolean') {
          boolValue = answer;
        } else if (typeof answer === 'object' && answer !== null) {
          const answerObj = answer as {
            boolean?: boolean;
            value?: string | number | boolean;
          };
          if (answerObj.boolean !== undefined) {
            boolValue = answerObj.boolean;
          } else if (answerObj.value !== undefined) {
            boolValue = Boolean(answerObj.value);
          } else {
            boolValue = false;
          }
        } else {
          boolValue = answer === 'true' || answer === 1;
        }
        formattedAnswer = boolValue ? 'はい' : 'いいえ';
        break;
      }

      case 'select':
        if (typeof answer === 'string') {
          formattedAnswer = answer;
        } else if (typeof answer === 'object' && answer !== null) {
          const answerObj = answer as {
            selected?: string;
            value?: string | number | boolean;
          };
          formattedAnswer =
            answerObj.selected ||
            (answerObj.value !== undefined ? String(answerObj.value) : '') ||
            JSON.stringify(answer);
        } else {
          formattedAnswer = String(answer);
        }
        break;

      case 'multiple_select': {
        let multiValue: string[];
        if (Array.isArray(answer)) {
          multiValue = answer;
        } else if (typeof answer === 'object' && answer !== null) {
          const answerObj = answer as {
            selected?: string[];
            value?: string[] | string;
          };
          multiValue =
            answerObj.selected ||
            (Array.isArray(answerObj.value)
              ? answerObj.value
              : answerObj.value
                ? [answerObj.value]
                : []) ||
            [];
        } else if (typeof answer === 'string') {
          multiValue = [answer];
        } else {
          multiValue = [String(answer)];
        }
        formattedAnswer = Array.isArray(multiValue)
          ? multiValue.join(', ')
          : String(multiValue);
        break;
      }

      default:
        formattedAnswer =
          typeof answer === 'object' && answer !== null
            ? JSON.stringify(answer)
            : String(answer);
    }

    return formattedAnswer || '（未回答）';
  };

  return (
    <div
      className={css({
        p: 3,
        bg: 'gray.50',
        borderRadius: 'md',
        border: '1px solid',
        borderColor: 'gray.200',
      })}
    >
      <div
        className={css({
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
          mb: 2,
        })}
      >
        <span
          className={css({
            fontWeight: 'bold',
            color: 'gray.700',
            fontSize: 'sm',
            flex: 1,
          })}
        >
          {questionData.title}
        </span>
        {questionData.is_required && (
          <span
            className={css({
              px: 2,
              py: '1px',
              bg: 'red.100',
              color: 'red.700',
              fontSize: 'xs',
              borderRadius: 'sm',
              fontWeight: 'medium',
            })}
          >
            必須
          </span>
        )}
      </div>
      <div
        className={css({
          p: 2,
          bg: 'white',
          borderRadius: 'sm',
          fontSize: 'sm',
          color: 'gray.800',
          minHeight: '24px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        })}
      >
        {formatEventAnswer()}
      </div>
    </div>
  );
};
