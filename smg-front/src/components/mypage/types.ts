// QuestionHistoryItemの型定義
import type { TrnQuestion, TrnAnswer } from '@/lib/supabase/types';

export interface QuestionHistoryItem {
  id: TrnQuestion['question_id'];
  question: TrnQuestion['content'];
  answer: TrnAnswer['content'];
  askedAt: string;
  answeredAt: string;
  status: TrnQuestion['status'];
  isPublic: boolean;
} 