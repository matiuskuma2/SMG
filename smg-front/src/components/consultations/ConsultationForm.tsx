import { useState, useEffect, useRef } from "react";
import { css } from "@/styled-system/css";
import { ConsultationHeader } from "./ConsultationHeader";
import { ConsultationInfo } from "./ConsultationInfo";
import { ConsultationDates } from "./ConsultationDates";
import { UrgentCheckbox } from "./UrgentCheckbox";
import { FirstTimeCheckbox } from "./FirstTimeCheckbox";
import { SelectedDates } from "./SelectedDates";
import { RemarksField } from "./RemarksField";
import { SubmitButton } from "./SubmitButton";
import { CancelButton } from "./CancelButton";
import { ApplicationStatus } from "./ApplicationStatus";
import { type ConsultationDetail, submitConsultationApplication, updateConsultationApplication, cancelConsultationApplication, getConsultationApplicationDetail, type ConsultationApplicationDetail, getConsultationQuestionAnswers, getConsultationQuestions } from "@/lib/api/consultation";
import { BackButton } from "@/components/ui/BackButton";
import { ConsultationQuestions } from "./ConsultationQuestions";
import { useIsInstructor } from "@/hooks/useIsInstructor";

interface ConsultationFormProps {
  consultation: ConsultationDetail;
  isApplied: boolean;
}

export function ConsultationForm({ consultation, isApplied }: ConsultationFormProps) {
  const { isInstructor, loading: isInstructorLoading } = useIsInstructor();
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isFirstConsultation, setIsFirstConsultation] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationDetail, setApplicationDetail] = useState<ConsultationApplicationDetail | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<{ [key: string]: any }>({});
  const [existingAnswers, setExistingAnswers] = useState<{ [key: string]: any }>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  // エラー発生時にスクロールする
  const scrollToError = () => {
    setTimeout(() => {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // 申し込み詳細情報を取得
  useEffect(() => {
    if (isApplied) {
      const fetchApplicationDetail = async () => {
        try {
          const detail = await getConsultationApplicationDetail(consultation.consultation_id);
          setApplicationDetail(detail);
          
          // 既存の質問回答を取得
          if (detail) {
            const answers = await getConsultationQuestionAnswers(detail.application_id);
            const answerMap: { [key: string]: any } = {};
            answers.forEach(answer => {
              answerMap[answer.question_id] = answer.answer;
            });
            setExistingAnswers(answerMap);
            
            // 編集モード時はフォームに既存データを設定
            if (isEditMode) {
              setIsUrgent(detail.is_urgent);
              setIsFirstConsultation(detail.is_first_consultation);
              setRemarks(detail.notes || '');
              setSelectedDates(detail.schedules.map(s => s.schedule_id));
              // 既存の回答をベースに設定（新しい質問にも対応）
              setQuestionAnswers({...answerMap});
            }
          }
        } catch (err) {
          console.error('Failed to fetch application detail:', err);
        }
      };
      fetchApplicationDetail();
    }
  }, [isApplied, consultation.consultation_id, isEditMode]);

  const handleDateChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedDates([...selectedDates, id]);
    } else {
      setSelectedDates(selectedDates.filter(dateId => dateId !== id));
    }
  };

  const handleQuestionAnswerChange = (questionId: string, answer: any) => {
    setQuestionAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // 当選しているかどうかの判定
  const isSelected = applicationDetail?.selection_status === 'approved';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // 必須質問のバリデーション
    try {
      const questions = await getConsultationQuestions(consultation.consultation_id);
      const requiredQuestions = questions.filter(q => q.is_required);
      const unansweredQuestions: string[] = [];

      for (const question of requiredQuestions) {
        const answer = questionAnswers[question.question_id];

        console.log('Validating question:', {
          questionId: question.question_id,
          title: question.title,
          type: question.question_type,
          answer: answer,
          isRequired: question.is_required
        });

        // 質問タイプごとに適切なバリデーション
        let isAnswerEmpty = false;

        if (answer === undefined || answer === null) {
          isAnswerEmpty = true;
        } else if (question.question_type === 'text' && answer === '') {
          isAnswerEmpty = true;
        } else if (question.question_type === 'select' && answer === '') {
          isAnswerEmpty = true;
        } else if (question.question_type === 'multiple_select' && (Array.isArray(answer) ? answer.length === 0 : true)) {
          isAnswerEmpty = true;
        } else if (question.question_type === 'boolean' && answer !== true && answer !== false) {
          isAnswerEmpty = true;
        }

        console.log('Validation result:', { isAnswerEmpty });

        if (isAnswerEmpty) {
          unansweredQuestions.push(question.title);
        }
      }

      if (unansweredQuestions.length > 0) {
        setError(`以下の必須質問に回答してください：\n${unansweredQuestions.map(title => `・${title}`).join('\n')}`);
        scrollToError();
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.error('Failed to validate questions:', err);
      setError('質問の検証に失敗しました。もう一度お試しください。');
      scrollToError();
      setIsSubmitting(false);
      return;
    }

    // バリデーション
    if (!isEditMode && selectedDates.length === 0) {
      setError("希望日程を1つ以上選択してください。");
      scrollToError();
      setIsSubmitting(false);
      return;
    }

    const now = new Date();
    const startDate = new Date(consultation.application_start_datetime);
    const endDate = new Date(consultation.application_end_datetime);

    if (!isEditMode) {
      if (now < startDate) {
        setError("申込開始前です。");
        scrollToError();
        setIsSubmitting(false);
        return;
      }

      if (now > endDate) {
        setError("申込期間が終了しています。");
        scrollToError();
        setIsSubmitting(false);
        return;
      }
    }

    try {
      // 質問回答を準備（有効な回答のみをフィルタリング）
      const validAnswers = Object.entries(questionAnswers)
        .filter(([questionId, answer]) => {
          // 空文字列、null、undefinedは除外
          if (answer === null || answer === undefined || answer === '') {
            return false;
          }
          // 配列の場合は空配列を除外
          if (Array.isArray(answer) && answer.length === 0) {
            return false;
          }
          return true;
        })
        .map(([questionId, answer]) => ({
          question_id: questionId,
          answer: answer
        }));

      if (isEditMode) {
        
        await updateConsultationApplication(consultation.consultation_id, {
          isUrgent,
          isFirstConsultation,
          remarks,
          selectedDates,
          questionAnswers: validAnswers
        });
        
        setIsEditMode(false);
        
        // アプリケーション詳細を再取得して表示を更新
        const detail = await getConsultationApplicationDetail(consultation.consultation_id);
        setApplicationDetail(detail);
        
        // 質問回答も再取得して更新
        if (detail) {
          const answers = await getConsultationQuestionAnswers(detail.application_id);
          const answerMap: { [key: string]: any } = {};
          answers.forEach(answer => {
            answerMap[answer.question_id] = answer.answer;
          });
          setExistingAnswers(answerMap);
        }
      } else {
        await submitConsultationApplication(consultation.consultation_id, {
          isUrgent,
          isFirstConsultation,
          remarks,
          selectedDates,
          questionAnswers: validAnswers
        });
        window.location.href = `/consultations/${consultation.consultation_id}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : (isEditMode ? '更新に失敗しました。' : '申込の送信に失敗しました。') + 'もう一度お試しください。');
      scrollToError();
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    if (applicationDetail) {
      setIsEditMode(true);
      setIsUrgent(applicationDetail.is_urgent);
      setIsFirstConsultation(applicationDetail.is_first_consultation);
      setRemarks(applicationDetail.notes || '');
      
      // スケジュールIDを正しく設定
      const scheduleIds = applicationDetail.schedules.map(s => s.schedule_id);
      setSelectedDates(scheduleIds);
      
      // 既存の回答をベースとして設定（新しい質問への回答も追加できるように）
      setQuestionAnswers({...existingAnswers});
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSelectedDates([]);
    setIsUrgent(false);
    setIsFirstConsultation(false);
    setRemarks('');
    setQuestionAnswers({});
    setError(null);
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    setError(null);

    try {
      await cancelConsultationApplication(consultation.consultation_id);
      window.location.href = `/consultations/${consultation.consultation_id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'キャンセルに失敗しました。もう一度お試しください。');
      scrollToError();
      console.error('Cancel error:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  const formStyles = css({
    bg: "white",
    p: "6",
    border: "1px solid",
    borderColor: "gray.200",
    borderRadius: "0 0 lg lg",
    boxShadow: "sm",
  });

  const formTitleStyles = css({
    fontSize: "lg",
    fontWeight: "semibold",
    mb: "6",
  });

  const titleStyles = css({
    fontSize: "2xl",
    fontWeight: "bold",
    mb: "2",
    display: "inline-block",
    maxWidth: "100%",
    wordBreak: "break-word"
  });

  const instructorStyles = css({
    color: "gray.600",
    fontSize: "lg",
    mb: "6",
  });

  const containerStyles = css({
    mx: "auto",
    px: "4",
    py: "8",
    pt: "16", // 戻るボタンの下にスペースを確保
    maxW: "2xl",
    position: "relative",
  });

  const errorStyles = css({
    color: "red.500",
    mb: "4",
    textAlign: "center",
    whiteSpace: "pre-line",
  });

  const handleAdminEdit = () => {
    const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://smg-dashboard.vercel.app';
    window.open(`${dashboardUrl}/individualConsultation/edit/${consultation.consultation_id}`, '_blank');
  };

  return (
    <div className={containerStyles}>
      <ConsultationHeader
        title={consultation.title}
        instructor={consultation.instructor.username}
        imageUrl={consultation.image_url}
      />

      {/* 戻るボタンと編集ボタン（フォーム外） */}
      <div className={css({
        position: 'absolute',
        top: '2',
        left: '2',
        right: '2',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      })}>
        <BackButton
          showText={false}
          className={css({ mb: '0' })}
          size={24}
        />
        {!isInstructorLoading && isInstructor && (
          <button
            type="button"
            onClick={handleAdminEdit}
            className={css({
              px: '4',
              py: '2',
              bg: 'blue.600',
              color: 'white',
              borderRadius: 'md',
              fontSize: 'sm',
              fontWeight: 'medium',
              cursor: 'pointer',
              transition: 'all 0.2s',
              _hover: {
                bg: 'blue.700',
              },
              _active: {
                transform: 'scale(0.98)',
              },
            })}
          >
            編集
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className={formStyles}>
        <h2 className={formTitleStyles}>
          {isApplied && !isEditMode ? '申込状況' : isEditMode ? '申込内容を編集' : '申請フォーム'}
        </h2>
        
        {error && <div ref={errorRef} className={errorStyles}>{error}</div>}
        
        <ConsultationInfo 
          startDate={consultation.application_start_datetime}
          endDate={consultation.application_end_datetime}
          description={consultation.description}
        />
        
        {(!isApplied || isEditMode) && (
          <>
            <div className={css({ mt: "6" })}>
              <ConsultationDates
                schedules={consultation.schedules}
                selectedDates={selectedDates}
                onDateChange={isSelected ? () => {} : handleDateChange}
                disabled={isSelected}
              />
            </div>
            
            <div className={css({ mb: "6" })}>
              <UrgentCheckbox 
                isUrgent={isUrgent} 
                setIsUrgent={setIsUrgent}
              />
              <FirstTimeCheckbox
                isFirstTime={isFirstConsultation}
                setIsFirstTime={setIsFirstConsultation}
              />
            </div>

            {selectedDates.length > 0 && (
              <SelectedDates 
                selectedDates={selectedDates} 
                schedules={consultation.schedules}
              />
            )}

            <div className={css({ mt: "10" })}>
              <ConsultationQuestions
                consultationId={consultation.consultation_id}
                answers={questionAnswers}
                onAnswerChange={handleQuestionAnswerChange}
              />
            </div>

            <RemarksField 
              remarks={remarks} 
              setRemarks={setRemarks} 
            />

            <div className={css({ display: 'flex', gap: '3', mt: '6' })}>
              <SubmitButton 
                isSubmitting={isSubmitting} 
                isBeforeStart={!isEditMode && new Date() < new Date(consultation.application_start_datetime)}
                isAfterEnd={!isEditMode && new Date() > new Date(consultation.application_end_datetime)}
                buttonText={isEditMode ? '更新する' : undefined}
              />
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className={css({
                    px: '6',
                    py: '2',
                    bg: 'gray.200',
                    color: 'gray.700',
                    border: 'none',
                    borderRadius: 'md',
                    cursor: 'pointer',
                    fontSize: 'sm',
                    fontWeight: 'medium',
                    _hover: {
                      bg: 'gray.300'
                    }
                  })}
                >
                  キャンセル
                </button>
              )}
            </div>
          </>
        )}

        {isApplied && !isEditMode && applicationDetail && (
          <>
            <ApplicationStatus 
              applicationDetail={applicationDetail}
              consultation={consultation}
              existingAnswers={existingAnswers}
            />
            <div className={css({ display: 'flex', gap: '3', mt: '6' })}>
              <button
                type="button"
                onClick={handleEdit}
                className={css({
                  px: '6',
                  py: '2',
                  bg: 'blue.500',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'md',
                  cursor: 'pointer',
                  fontSize: 'sm',
                  fontWeight: 'medium',
                  _hover: {
                    bg: 'blue.600'
                  }
                })}
              >
                編集
              </button>
              <CancelButton 
                isCancelling={isCancelling}
                onCancel={handleCancel}
              />
            </div>
          </>
        )}
      </form>
    </div>
  );
} 