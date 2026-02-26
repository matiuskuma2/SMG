// Supabaseの型定義をインポート
import { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase/types'

// Supabaseのテーブル型を直接使用
export type Question = Tables<'trn_question'>
export type Answer = Tables<'trn_answer'>
export type User = Tables<'mst_user'>

// Insert型もSupabaseから使用
export type QuestionInsert = TablesInsert<'trn_question'>
export type AnswerInsert = TablesInsert<'trn_answer'>

// Update型もSupabaseから使用
export type QuestionUpdate = TablesUpdate<'trn_question'>
export type AnswerUpdate = TablesUpdate<'trn_answer'>

// 質問コンポーネントで使用する簡略化されたユーザー型
export interface QuestionUser {
  user_id: string
  username: string | null
  nickname: string | null
  icon: string | null
  email: string
  user_type: string | null
} 