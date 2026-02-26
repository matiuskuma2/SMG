// お知らせに関する型定義
import type {
  InsertMstNotice,
  MstNotice,
  MstNoticeCategory,
} from '@/lib/supabase/types';

// お知らせファイル型
export type NoticeFile = {
  file_id?: string;
  notice_id?: string;
  file_url: string;
  file_name: string | null;
  display_order: number;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  file?: File | null;
  isNew?: boolean;
};

// Supabaseの挿入型をベースにフォーム用の型を作成
export type NoticeFormData = Pick<
  InsertMstNotice,
  'title' | 'content' | 'publish_end_at' | 'category_id'
> & {
  notice_id?: string; // 編集時に使用
  publish_start_at: string; // フォームでは必須
  visible_group_ids?: string[]; // 表示グループのID配列
  files?: NoticeFile[]; // 資料ファイル
};

// お知らせ一覧表示用の型（カテゴリー情報付き）
export type Notice = MstNotice & {
  category?: NoticeCategoryBasic | null; // カテゴリー情報をJOINで取得する場合
};

// カテゴリー基本情報型（表示・選択に必要な最小限）
export type NoticeCategoryBasic = {
  category_id: string;
  category_name: string;
};

// カテゴリー管理用型（管理画面で必要）
export type NoticeCategoryWithDescription = {
  category_id: string;
  category_name: string;
  description: string | null;
};

// カテゴリー完全型
export type NoticeCategory = MstNoticeCategory;
