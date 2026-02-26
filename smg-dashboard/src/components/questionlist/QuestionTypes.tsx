import type { TrnAnswer, TrnQuestion } from '@/lib/supabase/types';

// 質問に関する型定義
export interface Question extends TrnQuestion {
  // 表示用の追加フィールド
  user_name?: string; // 質問者名
  instructor_name?: string; // 講師名
  answer?: DbAnswer | null;
}

export type SortKey = 'questionDate' | 'answerDate';
export type DisplayStatus = '公開' | '非公開';
export type AnswerStatus = '未回答' | '回答済み';
export type FilterType = 'public' | 'anonymous';

// Supabase のデータ型定義
export interface DbQuestion extends TrnQuestion {
  // 結合されたデータ
  user_name?: string; // 質問者名
  instructor_name?: string; // 講師名
  answer?: DbAnswer | null;
}

export interface DbAnswer extends TrnAnswer {
  // 結合されたデータ
  instructor_name?: string; // 回答者名
}
