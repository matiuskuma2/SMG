import { useState, useEffect } from "react";
import { css } from "@/styled-system/css";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { EventQuestion, getEventQuestions } from "@/lib/api/event";

interface EventQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (answers: { [key: string]: any }) => void;
  eventId: string;
  initialAnswers?: { [key: string]: any };
}

export function EventQuestionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  eventId, 
  initialAnswers = {} 
}: EventQuestionModalProps) {
  const [questions, setQuestions] = useState<EventQuestion[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: any }>(initialAnswers);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const data = await getEventQuestions(eventId);
        setQuestions(data);
        // 初期回答がある場合は設定
        if (Object.keys(initialAnswers).length > 0) {
          setAnswers(initialAnswers);
        }
      } catch (err) {
        setError('質問の取得に失敗しました');
        console.error('Failed to fetch questions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && eventId) {
      fetchQuestions();
    }
  }, [isOpen, eventId, initialAnswers]);

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = () => {
    // 必須質問のバリデーション
    const requiredQuestions = questions.filter(q => q.is_required);
    const missingRequired = requiredQuestions.filter(q => {
      const answer = answers[q.question_id];
      return answer === undefined || answer === null || answer === '' || 
             (Array.isArray(answer) && answer.length === 0);
    });

    if (missingRequired.length > 0) {
      alert('必須項目に回答してください。');
      return;
    }

    onSubmit(answers);
  };

  const questionItemStyles = css({
    mb: "4",
    p: "4",
    border: "1px solid",
    borderColor: "gray.200",
    borderRadius: "md",
  });

  const questionTextStyles = css({
    fontSize: "sm",
    fontWeight: "medium",
    mb: "3",
    display: "flex",
    alignItems: "center",
    gap: "1",
  });

  const requiredBadgeStyles = css({
    fontSize: "xs",
    px: "2",
    py: "0.5",
    bg: "red.100",
    color: "red.700",
    borderRadius: "sm",
    fontWeight: "medium",
  });

  const textareaStyles = css({
    width: "100%",
    p: "2",
    border: "1px solid",
    borderColor: "gray.300",
    borderRadius: "md",
    fontSize: "sm",
    minHeight: "80px",
    resize: "vertical",
    _focus: {
      outline: "none",
      borderColor: "blue.500",
      boxShadow: "0 0 0 1px rgba(59, 130, 246, 0.1)",
    },
  });

  const radioGroupStyles = css({
    display: "flex",
    gap: "4",
    mt: "2",
  });

  const radioOptionStyles = css({
    display: "flex",
    alignItems: "center",
    gap: "2",
    fontSize: "sm",
  });

  const selectStyles = css({
    width: "100%",
    p: "2",
    border: "1px solid",
    borderColor: "gray.300",
    borderRadius: "md",
    fontSize: "sm",
    _focus: {
      outline: "none",
      borderColor: "blue.500",
      boxShadow: "0 0 0 1px rgba(59, 130, 246, 0.1)",
    },
  });

  const checkboxGroupStyles = css({
    display: "flex",
    flexDirection: "column",
    gap: "2",
    mt: "2",
  });

  const checkboxOptionStyles = css({
    display: "flex",
    alignItems: "center",
    gap: "2",
    fontSize: "sm",
  });

  const renderQuestionInput = (question: EventQuestion) => {
    const questionId = question.question_id;
    const currentAnswer = answers[questionId];

    switch (question.question_type) {
      case 'text':
        return (
          <textarea
            className={textareaStyles}
            value={(currentAnswer as string) || ''}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            placeholder="回答を入力してください"
          />
        );

      case 'boolean':
        return (
          <div className={radioGroupStyles}>
            <label className={radioOptionStyles}>
              <input
                type="radio"
                name={`question_${questionId}`}
                value="true"
                checked={currentAnswer === true}
                onChange={() => handleAnswerChange(questionId, true)}
              />
              <span>はい</span>
            </label>
            <label className={radioOptionStyles}>
              <input
                type="radio"
                name={`question_${questionId}`}
                value="false"
                checked={currentAnswer === false}
                onChange={() => handleAnswerChange(questionId, false)}
              />
              <span>いいえ</span>
            </label>
          </div>
        );

      case 'select':
        return (
          <select
            className={selectStyles}
            value={(currentAnswer as string) || ''}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
          >
            <option value="">選択してください</option>
            {question.options?.map((option, optionIndex) => (
              <option key={optionIndex} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multiple_select':
        const selectedOptions = Array.isArray(currentAnswer) ? (currentAnswer as string[]) : [];
        return (
          <div className={checkboxGroupStyles}>
            {question.options?.map((option, optionIndex) => (
              <label key={optionIndex} className={checkboxOptionStyles}>
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleAnswerChange(questionId, [...selectedOptions, option]);
                    } else {
                      handleAnswerChange(questionId, selectedOptions.filter(item => item !== option));
                    }
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return <div>未対応の質問タイプです</div>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      // 自動的にモーダルを閉じることを防ぐ
      // キャンセルボタンまたは送信後のみ閉じる
    }}>
      <DialogContent className={css({ maxWidth: "2xl", maxHeight: "90vh", overflow: "auto" })}>
        <DialogHeader>
          <DialogTitle>事前質問</DialogTitle>
        </DialogHeader>

        <div className={css({ py: "4" })}>
          {isLoading ? (
            <div className={css({ textAlign: "center", py: "8" })}>
              質問を読み込み中...
            </div>
          ) : error ? (
            <div className={css({ color: "red.500", textAlign: "center", py: "8" })}>
              {error}
            </div>
          ) : questions.length === 0 ? (
            <div className={css({ textAlign: "center", py: "8", color: "gray.500" })}>
              このイベントには質問がありません。
            </div>
          ) : (
            questions.map((question, index) => (
              <div key={question.question_id} className={questionItemStyles}>
                <div className={questionTextStyles}>
                  <span>Q{index + 1}. {question.title}</span>
                  {question.is_required && (
                    <span className={requiredBadgeStyles}>必須</span>
                  )}
                </div>
                
                {renderQuestionInput(question)}
              </div>
            ))
          )}
        </div>

        <DialogFooter className={css({
          display: 'flex',
          justifyContent: 'center',
          gap: { base: '3', md: '4' },
          width: '100%'
        })}>
          <div className={css({
            display: 'flex',
            flexDirection: { base: 'column', md: 'row' },
            justifyContent: 'center',
            gap: { base: '3', md: '4' },
            width: '100%'
          })}>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || questions.length === 0}
              className={css({
                bg: 'blue.500',
                color: 'white',
                px: { base: '6', md: '8' },
                py: { base: '2', md: '2' },
                rounded: 'full',
                _hover: { bg: 'blue.600' },
                minWidth: { base: '100%', md: '120px' }
              })}
            >
              次へ進む
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className={css({
                px: { base: '6', md: '8' },
                py: { base: '2', md: '2' },
                rounded: 'full',
                borderColor: 'gray.300',
                borderWidth: '1px',
                minWidth: { base: '100%', md: '120px' }
              })}
            >
              キャンセル
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}