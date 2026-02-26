import { Tables } from '@/lib/supabase/types'

// Supabaseテーブルの型を再エクスポート
export type EventFile = Tables<'mst_event_file'>
export type ArchiveFile = Tables<'trn_event_archive_file'>
export type ArchiveVideo = Tables<'trn_event_archive_video'>

// 資料のインターフェース（UIで使用）
export interface Material {
  id: string
  fileUrl: string
  displayOrder: number
  description?: string
  fileName?: string
}

// 動画のインターフェース（UIで使用）
export interface Video {
  id: string
  videoUrl: string
  displayOrder: number
}

// アーカイブ型（useArchivesフックで使用）
export type Archive = {
  archive_id: string
  title: string
  description: string | null
  event_id: string | null
  event_type_id: string
  type_id?: string | null
  publish_start_at: string | null
  publish_end_at: string | null
  created_at: string | null
  updated_at: string | null
  event_type_name: string
  archive_image_url: string | null
  image_url: string | null
  event_start_datetime?: string | null
  event_end_datetime?: string | null
  mst_archive_type?: {
    type_name: string
  } | null
  files: {
    file_id: string
    file_url: string
    display_order: number
    is_sawabe_instructor?: boolean
  }[]
  videos: {
    video_id: string
    video_url: string
    display_order: number
    is_sawabe_instructor?: boolean
  }[]
}

// アーカイブのインターフェース（UIで使用）
export interface ArchiveData {
  id: string
  title: string
  description: string | null
  archiveType: string // 'regular_meeting' または 'bookkeeping'
  eventId: string | null
  publishStartAt: string | null
  publishEndAt: string | null
  createdAt: string | null
  updatedAt: string | null
  imageUrl: string | null
  files: Material[]
  videos: Video[]
  eventFiles?: EventFile[]
  archiveFiles?: ArchiveFile[]
  archiveVideos?: ArchiveVideo[]
} 