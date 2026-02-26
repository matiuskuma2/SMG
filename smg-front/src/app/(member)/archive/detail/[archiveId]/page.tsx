'use client'

import React, { useEffect, useState } from 'react'
import { Container } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import { ArchiveDetail } from '@/components/archive/ArchiveDetail'
import { ArchiveData } from '@/components/archive/types'
import { createClient } from '@/lib/supabase'

export default function ArchiveDetailPage({ params }: { params: { archiveId: string } }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [archiveData, setArchiveData] = useState<ArchiveData | null>(null)

  useEffect(() => {
    const fetchArchiveDetail = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // 新しいテーブル構造からアーカイブデータを取得
        const { data: archive, error: archiveError } = await supabase
          .from('mst_event_archive')
          .select(`
            *,
            mst_event(
              image_url
            ),
            mst_event_type(
              event_type_name
            ),
            mst_archive_type(
              type_name
            ),
            files:trn_event_archive_file(
              file_id,
              file_url,
              file_name,
              display_order
            ),
            videos:trn_event_archive_video(
              video_id,
              video_url,
              display_order
            )
          `)
          .eq('archive_id', params.archiveId)
          .is('deleted_at', null)
          .eq('is_draft', false)
          .single()

        if (archiveError || !archive) {
          throw new Error('アーカイブデータが見つかりませんでした')
        }

        // アーカイブ表示制限チェック（写真・ニュースレターのみ）
        if (!archive.event_id) {
          // ユーザーの所属グループIDを取得
          const { data: { user } } = await supabase.auth.getUser();
          const userId = user?.id;

          let userGroupIds: string[] = [];
          if (userId) {
            const { data: userGroups } = await supabase
              .from('trn_group_user')
              .select('group_id')
              .eq('user_id', userId)
              .is('deleted_at', null);

            userGroupIds = userGroups?.map(ug => ug.group_id) || [];
          }

          // アーカイブ表示制限データを取得
          const { data: archiveRestrictionData } = await supabase
            .from('trn_event_archive_visible_group')
            .select('archive_id, group_id')
            .eq('archive_id', params.archiveId)
            .is('deleted_at', null);

          // 制限がある場合、ユーザーが対象グループに所属しているかチェック
          if (archiveRestrictionData && archiveRestrictionData.length > 0) {
            const hasAccess = archiveRestrictionData.some(r => userGroupIds.includes(r.group_id));
            if (!hasAccess) {
              throw new Error('このアーカイブにアクセスする権限がありません');
            }
          }
        }
        
        // アーカイブタイプを判定
        let archiveType = 'regular_meeting'
        if (archive.mst_archive_type?.type_name) {
          // mst_archive_typeがある場合（写真、ニュースレター）
          archiveType = archive.mst_archive_type.type_name === '写真' ? 'photos' : 'newsletter'
        } else if (archive.mst_event_type?.event_type_name) {
          // イベントタイプから判定
          archiveType = archive.mst_event_type.event_type_name === '定例会' ? 'regular_meeting' : 'bookkeeping'
        }

        // アーカイブのデータを整形
        setArchiveData({
          id: archive.archive_id,
          title: archive.title,
          description: archive.description,
          archiveType: archiveType,
          eventId: archive.event_id,
          publishStartAt: archive.publish_start_at,
          publishEndAt: archive.publish_end_at,
          createdAt: archive.created_at,
          updatedAt: archive.updated_at,
          imageUrl: archive.image_url || archive.mst_event?.image_url || null,
          files: archive.files.map((file: { file_id: string; file_url: string; file_name: string | null; display_order: number }) => ({
            id: file.file_id,
            fileUrl: file.file_url,
            fileName: file.file_name || undefined,
            displayOrder: file.display_order
          })),
          videos: archive.videos.map((video: { video_id: string; video_url: string; display_order: number }) => ({
            id: video.video_id,
            videoUrl: video.video_url,
            displayOrder: video.display_order
          }))
        })
      } catch (err) {
        console.error('アーカイブの取得エラー:', err)
        setError('アーカイブの取得中にエラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    fetchArchiveDetail()
  }, [params.archiveId])

  if (loading) {
    return (
      <Container mx="auto" py={{ base: "4", md: "6" }} px={{ base: "3", md: "4" }} maxWidth={{ base: "100%", md: "700px" }}>
        <div className={css({ textAlign: 'center', py: '8', color: 'gray.500' })}>
          読み込み中...
        </div>
      </Container>
    )
  }

  if (error || !archiveData) {
    return (
      <Container mx="auto" py={{ base: "4", md: "6" }} px={{ base: "3", md: "4" }} maxWidth={{ base: "100%", md: "700px" }}>
        <div className={css({ textAlign: 'center', py: '8', color: 'red.500' })}>
          {error || 'アーカイブデータが見つかりませんでした'}
        </div>
      </Container>
    )
  }

  return (
    <Container mx="auto" py={{ base: "4", md: "6" }} px={{ base: "3", md: "4" }} maxWidth={{ base: "100%", md: "700px" }}>
      <ArchiveDetail archiveData={archiveData} />
    </Container>
  )
} 