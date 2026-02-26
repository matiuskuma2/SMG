import { Tables } from '@/lib/supabase/types';

// ガイド項目の型定義（Supabaseテーブル + is_completedプロパティ）
export type GuideItemType = Tables<'mst_beginner_guide_item'> & {
  is_completed: boolean;
}

// ガイド動画の型定義（Supabaseテーブルを直接使用）
export type GuideVideoType = Tables<'mst_beginner_guide_video'>;

// ガイドファイルの型定義（Supabaseテーブルを直接使用）
export type GuideFileType = Tables<'mst_beginner_guide_file'>; 