// 質問タイプの定義
export enum QuestionType {
  MultipleChoice = 'multiple-choice',
  ShortAnswer = 'short-answer',
}

// 質問アイテムの型定義
export interface QuestionItem {
  id: string;
  type: QuestionType;
  title: string;
  options?: string[];
  required: boolean;
}

// アンケートフォームの型定義
export interface EnqueteFormData {
  title: string;
  description: string;
  questions: QuestionItem[];
}
