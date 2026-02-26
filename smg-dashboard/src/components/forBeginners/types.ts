import type {
  InsertMstBeginnerGuideFile,
  MstBeginnerGuideFile,
  MstBeginnerGuideItem,
} from '@/lib/supabase/types';

// 初めての方 資料ファイル型（フォーム用にfileプロパティを追加）
export type BeginnerGuideFile = MstBeginnerGuideFile & {
  file?: File | null;
  display_order: number;
};

// フォーム送信用の型：MstBeginnerGuideItemのフィールドに動画とファイルを追加
export type ForBeginnersFormSubmitData = Pick<
  MstBeginnerGuideItem,
  'guide_item_id' | 'title' | 'description'
> & {
  movieUrl: string; // 動画URL
  movieFile?: File; // 動画ファイル
  files: BeginnerGuideFile[]; // 資料ファイル（複数）
};

// Partialバージョン（初期データ用）
export type PartialForBeginnersFormData = Partial<
  Pick<MstBeginnerGuideItem, 'guide_item_id' | 'title' | 'description'> & {
    movieUrl: string;
  }
> & {
  files?: BeginnerGuideFile[];
};

// Insert用の型（使用されているもののみ）
export type InsertBeginnerGuideFile = InsertMstBeginnerGuideFile;
