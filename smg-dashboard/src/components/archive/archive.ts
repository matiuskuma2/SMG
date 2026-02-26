import type {
  MstEventArchive,
  TrnEventArchiveFile,
  TrnEventArchiveVideo,
} from '@/lib/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Dispatch, SetStateAction } from 'react';

// アーカイブファイルの型定義
export type ArchiveFile = TrnEventArchiveFile;

// アーカイブ動画の型定義
export type ArchiveVideo = TrnEventArchiveVideo;

// アーカイブフォームデータの型定義
export interface ArchiveFormData
  extends Omit<MstEventArchive, 'archive_id' | 'type_id'> {
  files: ArchiveFile[];
  videos: ArchiveVideo[];
  type_id?: string | null;
  visible_group_ids?: string[];
}

// アーカイブフォームのProps型定義
export interface ArchiveFormProps {
  eventId: string;
  onSubmit: (data: ArchiveFormData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
  initialData?: ArchiveFormData;
  isEditing?: boolean;
  archiveTypes?: { id: string; name: string; description?: string }[];
  selectedArchiveType?: string;
  onArchiveTypeChange?: (typeId: string) => void;
  themes?: Array<{ theme_id: string; theme_name: string }>;
  isEventArchive?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
}

// ファイルアップローダーのProps型定義
export interface FileUploaderProps {
  initialFiles?: ArchiveFile[];
  onChange: (files: ArchiveFile[]) => void;
  themes?: Array<{ theme_id: string; theme_name: string }>;
}

// 動画アップローダーのProps型定義
export interface VideoUploaderProps {
  supabase: SupabaseClient;
  videos: ArchiveVideo[];
  onVideosChange: Dispatch<SetStateAction<ArchiveVideo[]>>;
  isSubmitting: boolean;
  themes?: Array<{ theme_id: string; theme_name: string }>;
}
