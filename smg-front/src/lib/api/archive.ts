import { createClient } from '@supabase/supabase-js'
import { EventFile, ArchiveFile, ArchiveVideo, ArchiveData } from '../../components/archive/types'

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * イベントIDに基づいてイベントファイルを取得する
 * @param eventId イベントID
 * @returns イベントファイルの配列
 */
export const getEventFiles = async (eventId: string): Promise<EventFile[]> => {
  try {
    const { data, error } = await supabase
      .from('mst_event_file')
      .select('*')
      .eq('event_id', eventId)
      .is('deleted_at', null)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('イベントファイル取得エラー:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('イベントファイル取得例外:', error)
    return []
  }
}

/**
 * アーカイブIDに基づいてアーカイブファイルを取得する
 * @param archiveId アーカイブID
 * @returns アーカイブファイルの配列
 */
export const getArchiveFiles = async (archiveId: string): Promise<ArchiveFile[]> => {
  try {
    const { data, error } = await supabase
      .from('trn_event_archive_file')
      .select('*')
      .eq('archive_id', archiveId)
      .is('deleted_at', null)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('アーカイブファイル取得エラー:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('アーカイブファイル取得例外:', error)
    return []
  }
}

/**
 * アーカイブIDに基づいてアーカイブ動画を取得する
 * @param archiveId アーカイブID
 * @returns アーカイブ動画の配列
 */
export const getArchiveVideos = async (archiveId: string): Promise<ArchiveVideo[]> => {
  try {
    const { data, error } = await supabase
      .from('trn_event_archive_video')
      .select('*')
      .eq('archive_id', archiveId)
      .is('deleted_at', null)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('アーカイブ動画取得エラー:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('アーカイブ動画取得例外:', error)
    return []
  }
}

/**
 * アーカイブIDに基づいてアーカイブの詳細データを取得する
 * @param archiveId アーカイブID
 * @returns アーカイブデータ
 */
export const getArchiveDetail = async (archiveId: string): Promise<ArchiveData | null> => {
  try {
    const { data, error } = await supabase
      .from('trn_event_archive')
      .select('*')
      .eq('archive_id', archiveId)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('アーカイブ詳細取得エラー:', error)
      return null
    }

    if (!data) {
      return null
    }

    // アーカイブファイルと動画を並列で取得
    const [archiveFiles, archiveVideos] = await Promise.all([
      getArchiveFiles(archiveId),
      getArchiveVideos(archiveId)
    ])

    return {
      id: data.archive_id,
      title: data.title,
      description: data.description,
      archiveType: data.archive_type,
      eventId: data.event_id,
      publishStartAt: data.publish_start_at,
      publishEndAt: data.publish_end_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      imageUrl: data.image_url,
      files: archiveFiles.map(file => ({
        id: file.file_id,
        fileUrl: file.file_url,
        displayOrder: file.display_order
      })),
      videos: archiveVideos.map(video => ({
        id: video.video_id,
        videoUrl: video.video_url,
        displayOrder: video.display_order
      }))
    }
  } catch (error) {
    console.error('アーカイブ詳細取得例外:', error)
    return null
  }
} 