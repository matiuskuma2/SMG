import { css } from '@/styled-system/css';
import type {
  ConsultationQuestion,
  ConsultationQuestionFormType,
  ConsultationQuestionOption,
} from '@/types/individualConsultation';
import { EditIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ConsultationQuestionManagerProps {
  consultationId: string | null;
  isEditing: boolean;
  onQuestionsChange?: (questions: ConsultationQuestionFormType[]) => void;
  initialQuestions?: ConsultationQuestionFormType[];
}

export function ConsultationQuestionManager({
  consultationId,
  isEditing,
  onQuestionsChange,
  initialQuestions = [],
}: ConsultationQuestionManagerProps) {
  const [questions, setQuestions] = useState<ConsultationQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] =
    useState<ConsultationQuestion | null>(null);
  const [formData, setFormData] = useState<ConsultationQuestionFormType>({
    title: '',
    question_type: 'text',
    is_required: false,
    display_order: 0,
    options: [],
  });

  // 選択肢の一意ID管理
  const [optionIds, setOptionIds] = useState<string[]>([]);

  // 新規作成時用のローカル質問データ
  const [localQuestions, setLocalQuestions] =
    useState<ConsultationQuestionFormType[]>(initialQuestions);

  // 質問一覧を取得
  const fetchQuestions = useCallback(async () => {
    if (!consultationId) {
      // consultation_idがない場合（新規作成時）は空の配列を設定
      setQuestions([]);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching questions for consultation ID:', consultationId);
      const response = await fetch(
        `/api/consultation-questions?consultation_id=${consultationId}`,
      );
      console.log('API Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error response:', errorData);
        throw new Error('質問の取得に失敗しました');
      }
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('質問取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // フォームの初期化
  const resetForm = () => {
    setFormData({
      title: '',
      question_type: 'text',
      is_required: false,
      display_order: consultationId ? questions.length : localQuestions.length,
      options: [],
    });
    setOptionIds([]);
    setEditingQuestion(null);
    setShowForm(false);
  };

  // 質問の作成・更新
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 選択肢の重複チェック
    if (formData.options && formData.options.length > 0) {
      const trimmed = formData.options.map((o) => o.trim());
      if (new Set(trimmed).size !== trimmed.length) {
        alert('同じ選択肢が複数あります');
        return;
      }
    }

    if (consultationId) {
      // 編集時：APIを呼び出す
      try {
        setLoading(true);

        const method = editingQuestion ? 'PUT' : 'POST';
        const body = editingQuestion
          ? { ...formData, question_id: editingQuestion.question_id }
          : { ...formData, consultation_id: consultationId };

        const response = await fetch('/api/consultation-questions', {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) throw new Error('質問の保存に失敗しました');

        await fetchQuestions();
        resetForm();
      } catch (error) {
        console.error('質問保存エラー:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // 新規作成時：ローカルで管理
      if (editingQuestion) {
        // ローカル質問の編集
        const updatedQuestions = localQuestions.map((q, index) =>
          index === editingQuestion.display_order ? formData : q,
        );
        setLocalQuestions(updatedQuestions);
        onQuestionsChange?.(updatedQuestions);
      } else {
        // ローカル質問の追加
        const newQuestion = {
          ...formData,
          display_order: localQuestions.length,
        };
        const updatedQuestions = [...localQuestions, newQuestion];
        setLocalQuestions(updatedQuestions);
        onQuestionsChange?.(updatedQuestions);
      }
      resetForm();
    }
  };

  // 質問の削除
  const handleDelete = async (questionIdOrIndex: string | number) => {
    if (!confirm('この質問を削除しますか？')) return;

    if (consultationId) {
      // 編集時：APIを呼び出す
      try {
        setLoading(true);
        const response = await fetch(
          `/api/consultation-questions?question_id=${questionIdOrIndex}`,
          {
            method: 'DELETE',
          },
        );

        if (!response.ok) throw new Error('質問の削除に失敗しました');

        await fetchQuestions();
      } catch (error) {
        console.error('質問削除エラー:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // 新規作成時：ローカルで削除
      const updatedQuestions = localQuestions.filter(
        (_, index) => index !== questionIdOrIndex,
      );
      // display_orderを再調整
      const reorderedQuestions = updatedQuestions.map((q, index) => ({
        ...q,
        display_order: index,
      }));
      setLocalQuestions(reorderedQuestions);
      onQuestionsChange?.(reorderedQuestions);
    }
  };

  // 編集開始
  const handleEdit = (
    question: ConsultationQuestion | ConsultationQuestionFormType,
    index?: number,
  ) => {
    if (consultationId) {
      // 編集時：通常の処理
      const q = question as ConsultationQuestion;
      console.log('=== 編集モード開始 ===');
      console.log('編集対象の質問:', {
        id: q.question_id,
        title: q.title,
        display_order: q.display_order,
      });
      setEditingQuestion(q);
      setFormData({
        title: q.title,
        question_type: q.question_type,
        is_required: q.is_required,
        display_order: q.display_order,
        options: q.options || [],
      });
      console.log('設定したformData:', {
        title: q.title,
        display_order: q.display_order,
      });
      // 選択肢のIDを生成
      setOptionIds(q.options?.map(() => crypto.randomUUID()) || []);
    } else {
      // 新規作成時：ローカル質問の編集
      const q = question as ConsultationQuestionFormType;
      setEditingQuestion({
        ...q,
        question_id: '',
        display_order: index || 0,
      } as ConsultationQuestion);
      setFormData({
        title: q.title,
        question_type: q.question_type,
        is_required: q.is_required,
        display_order: q.display_order,
        options: q.options || [],
      });
      // 選択肢のIDを生成
      setOptionIds(q.options?.map(() => crypto.randomUUID()) || []);
    }
    setShowForm(true);
  };

  return (
    <div className={containerStyle}>
      <div className={headerStyle}>
        <h3 className={titleStyle}>申込時質問設定</h3>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className={addButtonStyle}
          disabled={loading}
        >
          <PlusIcon size={16} />
          質問を追加
        </button>
      </div>

      {/* 質問一覧 */}
      <div className={questionsListStyle}>
        {(() => {
          const displayQuestions = consultationId
            ? questions
            : localQuestions.map(
                (q, index) =>
                  ({
                    ...q,
                    question_id: `local-${index}`,
                  }) as ConsultationQuestion,
              );

          return displayQuestions.length === 0 ? (
            <p className={emptyMessageStyle}>質問が設定されていません</p>
          ) : (
            displayQuestions.map((question, index) => {
              return (
                <div key={question.question_id} className={questionItemStyle}>
                  <div className={questionHeaderStyle}>
                    <span className={questionNumberStyle}>Q{index + 1}</span>
                    <span
                      className={questionTypeStyle}
                      data-type={question.question_type}
                    >
                      {question.question_type === 'text'
                        ? 'テキスト'
                        : question.question_type === 'boolean'
                          ? 'はい/いいえ'
                          : question.question_type === 'select'
                            ? '単一選択'
                            : '複数選択'}
                    </span>
                    {question.is_required && (
                      <span className={requiredBadgeStyle}>必須</span>
                    )}
                    <div className={actionButtonsStyle}>
                      <button
                        type="button"
                        onClick={() =>
                          consultationId
                            ? handleEdit(question)
                            : handleEdit(localQuestions[index], index)
                        }
                        className={editButtonStyle}
                        disabled={loading}
                      >
                        <EditIcon size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          consultationId
                            ? handleDelete(question.question_id)
                            : handleDelete(index)
                        }
                        className={deleteButtonStyle}
                        disabled={loading}
                      >
                        <TrashIcon size={20} />
                      </button>
                    </div>
                  </div>
                  <p className={questionTextStyle}>{question.title}</p>
                  {/* 選択肢がある場合は表示 */}
                  {question.options && question.options.length > 0 && (
                    <div className={optionsDisplayStyle}>
                      <p className={optionsLabelStyle}>選択肢:</p>
                      <ul className={optionsListStyle}>
                        {question.options.map((option, index) => (
                          <li
                            key={`${question.question_id}-option-${index}`}
                            className={optionItemStyle}
                          >
                            {option}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })
          );
        })()}
      </div>

      {/* 質問追加・編集フォーム */}
      {showForm && (
        <div className={formOverlayStyle}>
          <div className={formContainerStyle}>
            <h4 className={formTitleStyle}>
              {editingQuestion ? '質問を編集' : '質問を追加'}
            </h4>
            <div className={formStyle}>
              <div className={fieldStyle}>
                <label htmlFor="question-title" className={labelStyle}>
                  質問文 *
                </label>
                <textarea
                  id="question-title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className={textareaStyle}
                  rows={3}
                  placeholder="質問内容を入力してください"
                />
              </div>

              <div className={fieldStyle}>
                <label htmlFor="question-type" className={labelStyle}>
                  回答形式 *
                </label>
                <select
                  id="question-type"
                  value={formData.question_type}
                  onChange={(e) => {
                    const newType = e.target.value as
                      | 'text'
                      | 'boolean'
                      | 'select'
                      | 'multiple_select';

                    if (['select', 'multiple_select'].includes(newType)) {
                      // 選択式に変更する場合、デフォルトの選択肢を追加
                      setFormData({
                        ...formData,
                        question_type: newType,
                        options: ['選択肢1'],
                      });
                      setOptionIds([crypto.randomUUID()]);
                    } else {
                      // テキストまたはbooleanに変更する場合、選択肢をクリア
                      setFormData({
                        ...formData,
                        question_type: newType,
                        options: [],
                      });
                      setOptionIds([]);
                    }
                  }}
                  className={selectStyle}
                  required
                >
                  <option value="text">テキスト入力</option>
                  <option value="boolean">はい/いいえ選択</option>
                  <option value="select">単一選択</option>
                  <option value="multiple_select">複数選択</option>
                </select>
              </div>

              {/* 選択肢入力（選択式の場合のみ） */}
              {['select', 'multiple_select'].includes(
                formData.question_type,
              ) && (
                <div className={fieldStyle}>
                  <div className={labelStyle}>選択肢 *</div>
                  {formData.options?.map((option, index) => (
                    <div
                      key={optionIds[index] || `form-option-${index}`}
                      className={optionFieldStyle}
                    >
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(formData.options || [])];
                          newOptions[index] = e.target.value;
                          setFormData({ ...formData, options: newOptions });
                        }}
                        className={textInputStyle}
                        placeholder={`選択肢 ${index + 1}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newOptions = formData.options?.filter(
                            (_, i) => i !== index,
                          );
                          const newOptionIds = optionIds.filter(
                            (_, i) => i !== index,
                          );
                          setFormData({ ...formData, options: newOptions });
                          setOptionIds(newOptionIds);
                        }}
                        className={removeOptionButtonStyle}
                        disabled={formData.options?.length === 1}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newOptions = [...(formData.options || [])];
                      const nextIndex = newOptions.length + 1;
                      newOptions.push(`選択肢${nextIndex}`);
                      setFormData({ ...formData, options: newOptions });
                      setOptionIds([...optionIds, crypto.randomUUID()]);
                    }}
                    className={addOptionButtonStyle}
                  >
                    <PlusIcon size={14} />
                    選択肢を追加
                  </button>
                </div>
              )}

              <div className={checkboxFieldStyle}>
                <label className={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={formData.is_required}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_required: e.target.checked,
                      })
                    }
                    className={checkboxStyle}
                  />
                  必須回答
                </label>
              </div>

              <div className={formActionsStyle}>
                <button
                  type="button"
                  onClick={resetForm}
                  className={cancelButtonStyle}
                  disabled={loading}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmit(e);
                  }}
                  className={submitButtonStyle}
                  disabled={loading}
                >
                  {loading ? '保存中...' : editingQuestion ? '更新' : '追加'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// スタイル定義
const containerStyle = css({
  marginTop: '24px',
  padding: '20px',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  backgroundColor: '#f8fafc',
});

const headerStyle = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
});

const titleStyle = css({
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1a202c',
});

const addButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 16px',
  backgroundColor: '#3182ce',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  cursor: 'pointer',
  _hover: {
    backgroundColor: '#2c5aa0',
  },
  _disabled: {
    backgroundColor: '#a0aec0',
    cursor: 'not-allowed',
  },
});

const questionsListStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

const emptyMessageStyle = css({
  textAlign: 'center',
  color: '#718096',
  fontSize: '14px',
  padding: '20px',
});

const questionItemStyle = css({
  backgroundColor: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  padding: '16px',
});

const questionHeaderStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '8px',
});

const questionNumberStyle = css({
  backgroundColor: '#3182ce',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'bold',
});

const questionTypeStyle = css({
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'medium',
  backgroundColor: '#edf2f7',
  color: '#4a5568',
});

const requiredBadgeStyle = css({
  backgroundColor: '#fed7d7',
  color: '#c53030',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'medium',
});

const actionButtonsStyle = css({
  display: 'flex',
  gap: '8px',
  marginLeft: 'auto',
});

const editButtonStyle = css({
  padding: '4px',
  backgroundColor: '#edf2f7',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  color: '#4a5568',
  _hover: {
    backgroundColor: '#e2e8f0',
  },
});

const deleteButtonStyle = css({
  padding: '4px',
  backgroundColor: '#fed7d7',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  color: '#c53030',
  _hover: {
    backgroundColor: '#feb2b2',
  },
});

const questionTextStyle = css({
  fontSize: '14px',
  color: '#2d3748',
  marginBottom: '8px',
});

const optionsDisplayStyle = css({
  marginTop: '8px',
});

const optionsLabelStyle = css({
  fontSize: '12px',
  fontWeight: 'medium',
  color: '#4a5568',
  marginBottom: '4px',
});

const optionsListStyle = css({
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
});

const optionItemStyle = css({
  backgroundColor: '#edf2f7',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  color: '#4a5568',
});

const formOverlayStyle = css({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
});

const formContainerStyle = css({
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '24px',
  maxWidth: '600px',
  width: '90vw',
  maxHeight: '80vh',
  overflow: 'auto',
});

const formTitleStyle = css({
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '16px',
  color: '#1a202c',
});

const formStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
});

const fieldStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

const labelStyle = css({
  fontSize: '14px',
  fontWeight: 'medium',
  color: '#4a5568',
});

const textareaStyle = css({
  padding: '8px 12px',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  fontSize: '14px',
  resize: 'vertical',
  _focus: {
    outline: 'none',
    borderColor: '#3182ce',
  },
});

const selectStyle = css({
  padding: '8px 12px',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  fontSize: '14px',
  backgroundColor: 'white',
  _focus: {
    outline: 'none',
    borderColor: '#3182ce',
  },
});

const optionFieldStyle = css({
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
});

const textInputStyle = css({
  flex: 1,
  padding: '8px 12px',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  fontSize: '14px',
  _focus: {
    outline: 'none',
    borderColor: '#3182ce',
  },
});

const removeOptionButtonStyle = css({
  padding: '8px',
  backgroundColor: '#fed7d7',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  color: '#c53030',
  _hover: {
    backgroundColor: '#feb2b2',
  },
  _disabled: {
    backgroundColor: '#f7fafc',
    color: '#a0aec0',
    cursor: 'not-allowed',
  },
});

const addOptionButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 16px',
  backgroundColor: '#edf2f7',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  color: '#4a5568',
  _hover: {
    backgroundColor: '#e2e8f0',
  },
});

const checkboxFieldStyle = css({
  display: 'flex',
  alignItems: 'center',
});

const checkboxLabelStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  color: '#4a5568',
  cursor: 'pointer',
});

const checkboxStyle = css({
  width: '16px',
  height: '16px',
});

const formActionsStyle = css({
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
  marginTop: '24px',
});

const cancelButtonStyle = css({
  padding: '8px 16px',
  backgroundColor: '#f7fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  color: '#4a5568',
  _hover: {
    backgroundColor: '#edf2f7',
  },
});

const submitButtonStyle = css({
  padding: '8px 16px',
  backgroundColor: '#3182ce',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  _hover: {
    backgroundColor: '#2c5aa0',
  },
  _disabled: {
    backgroundColor: '#a0aec0',
    cursor: 'not-allowed',
  },
});
