'use client';

import { ArchiveForm } from '@/components/archive/ArchiveForm';
import type {
  ArchiveFile,
  ArchiveFormData,
  ArchiveVideo,
} from '@/components/archive/archive';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { revalidateArchive } from '@/lib/api/revalidate';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import { jstToUtc } from '@/utils/date';
import { getReturnQuery } from '@/utils/navigation';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ArchiveEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const archiveId = params.id as string;
  const supabase = createClient();

  // リストページに戻る際のURL（クエリパラメータを保持）
  const getReturnUrl = () => {
    const returnQuery = getReturnQuery(searchParams);
    return returnQuery ? `/archive?${returnQuery}` : '/archive';
  };

  const [archiveTypes, setArchiveTypes] = useState<
    { id: string; name: string; description?: string }[]
  >([]);
  const [selectedArchiveType, setSelectedArchiveType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<ArchiveFormData | undefined>(
    undefined,
  );

  // 削除モーダル用の状態
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // アーカイブタイプをデータベースから取得を試行
        try {
          const { data: archiveTypeData, error: archiveTypeError } =
            await supabase
              .from('mst_archive_type')
              .select('type_id, type_name, description')
              .is('deleted_at', null)
              .order('type_name', { ascending: true });

          if (
            !archiveTypeError &&
            archiveTypeData &&
            archiveTypeData.length > 0
          ) {
            const mappedTypes = archiveTypeData.map((type) => ({
              id: type.type_id,
              name: type.type_name,
              description: type.description || undefined,
            }));
            setArchiveTypes(mappedTypes);
          } else {
            // データが存在しない場合
            setArchiveTypes([]);
          }
        } catch (error) {
          console.warn('Archive type table not found or no data available');
          // テーブルが存在しない場合は空の配列
          setArchiveTypes([]);
        }

        // アーカイブデータを取得
        if (archiveId) {
          const { data: archiveData, error: archiveError } = await supabase
            .from('mst_event_archive')
            .select('*')
            .eq('archive_id', archiveId)
            .is('deleted_at', null)
            .single();

          if (archiveError) throw archiveError;

          // ファイルデータの取得
          const { data: fileData, error: fileError } = await supabase
            .from('trn_event_archive_file')
            .select('*')
            .eq('archive_id', archiveId)
            .is('deleted_at', null)
            .order('display_order', { ascending: true });

          if (fileError) throw fileError;

          // 動画データの取得
          const { data: videoData, error: videoError } = await supabase
            .from('trn_event_archive_video')
            .select('*')
            .eq('archive_id', archiveId)
            .is('deleted_at', null)
            .order('display_order', { ascending: true });

          if (videoError && videoError.code !== 'PGRST116') {
            throw videoError;
          }

          // 表示グループデータの取得
          const { data: visibleGroupData, error: visibleGroupError } =
            await supabase
              .from('trn_event_archive_visible_group')
              .select('group_id')
              .eq('archive_id', archiveId)
              .is('deleted_at', null);

          if (visibleGroupError && visibleGroupError.code !== 'PGRST116') {
            throw visibleGroupError;
          }

          const visibleGroupIds =
            visibleGroupData?.map((item) => item.group_id) || [];

          // 初期データの設定
          setInitialData({
            title: archiveData.title || '',
            description: archiveData.description || '',
            publish_start_at: archiveData.publish_start_at || '',
            publish_end_at: archiveData.publish_end_at || '',
            files:
              fileData?.map((file) => ({
                file_id: file.file_id,
                archive_id: file.archive_id,
                file_url: file.file_url,
                file_name: file.file_name,
                display_order: file.display_order,
                is_sawabe_instructor: file.is_sawabe_instructor,
                theme_id: file.theme_id,
                created_at: file.created_at,
                updated_at: file.updated_at,
                deleted_at: file.deleted_at,
              })) || [],
            videos:
              videoData?.map((video) => ({
                video_id: video.video_id,
                archive_id: video.archive_id,
                video_url: video.video_url,
                video_image_url: video.video_image_url,
                display_order: video.display_order,
                is_sawabe_instructor: video.is_sawabe_instructor,
                theme_id: video.theme_id,
                created_at: video.created_at,
                updated_at: video.updated_at,
                deleted_at: video.deleted_at,
              })) || [],
            event_id: '',
            event_type_id: '',
            type_id: archiveData.type_id || null,
            is_draft: archiveData.is_draft,
            created_at: archiveData.created_at,
            updated_at: archiveData.updated_at,
            deleted_at: archiveData.deleted_at,
            visible_group_ids: visibleGroupIds,
            image_url: archiveData.image_url || null,
            notification_sent: archiveData.notification_sent ?? false,
          });

          // 編集時のアーカイブタイプを設定（実際のtype_idを使用）
          if (archiveData.type_id) {
            setSelectedArchiveType(archiveData.type_id);
          }
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
        alert('データの取得に失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [archiveId, supabase]);

  // フォーム送信処理
  const handleSubmit = async (data: ArchiveFormData) => {
    try {
      if (archiveTypes.length === 0) {
        alert(
          'アーカイブタイプが設定されていません。管理者にお問い合わせください。',
        );
        return;
      }

      if (!selectedArchiveType) {
        alert('アーカイブタイプを選択してください。');
        return;
      }

      // 日本時間からUTCに変換
      const publish_start_at = data.publish_start_at
        ? jstToUtc(data.publish_start_at)
        : null;
      const publish_end_at = data.publish_end_at
        ? jstToUtc(data.publish_end_at)
        : null;

      // 更新処理
      const updateData = {
        title: data.title,
        description: data.description,
        publish_start_at: publish_start_at,
        publish_end_at: publish_end_at,
        event_id: null,
        type_id: selectedArchiveType || null,
        is_draft: data.is_draft,
        image_url: data.image_url || null,
      };

      const { data: updatedData, error: updateError } = await supabase
        .from('mst_event_archive')
        .update(updateData)
        .eq('archive_id', archiveId)
        .select()
        .single();

      if (updateError) {
        throw new Error(
          `アーカイブの更新に失敗しました: ${updateError.message}`,
        );
      }

      // ファイル保存処理
      await saveArchiveFiles(archiveId, data.files);

      // 動画処理
      await saveArchiveVideos(archiveId, data.videos, archiveId);

      // 表示グループ保存処理
      await saveVisibleGroups(archiveId, data.visible_group_ids || []);

      // キャッシュを再検証
      await revalidateArchive();

      alert(
        data.is_draft ? '下書き保存されました' : 'アーカイブが更新されました',
      );

      // 送信成功後、一覧ページに戻る
      router.push(getReturnUrl());
    } catch (error) {
      console.error('アーカイブ処理エラー:', error);
      alert(
        'アーカイブの更新に失敗しました。\n詳細はコンソールを確認してください。',
      );
      throw error;
    }
  };

  // ファイル保存処理
  const saveArchiveFiles = async (archiveId: string, files: ArchiveFile[]) => {
    try {
      // 既存のファイルを削除
      const { error: deleteError } = await supabase
        .from('trn_event_archive_file')
        .delete()
        .eq('archive_id', archiveId);

      if (deleteError) {
        throw deleteError;
      }

      // 新しいファイルがなければ終了
      if (!files || files.length === 0) {
        return;
      }

      // 各ファイルを処理
      const fileInserts = [];

      for (const file of files) {
        // 既にURLがある場合はそのまま使用
        if (file.file_url) {
          fileInserts.push({
            archive_id: archiveId,
            file_url: file.file_url,
            file_name: file.file_name || null,
            display_order: file.display_order || fileInserts.length + 1,
            theme_id: file.theme_id || null,
            is_sawabe_instructor: file.is_sawabe_instructor || false,
          });
          continue;
        }

        // 新しいファイルの場合はアップロード
        if ('file' in file && file.file instanceof File) {
          const fileUrl = await uploadFile(file.file);
          fileInserts.push({
            archive_id: archiveId,
            file_url: fileUrl,
            file_name: file.file_name || file.file.name,
            display_order: file.display_order || fileInserts.length + 1,
            theme_id: file.theme_id || null,
            is_sawabe_instructor: file.is_sawabe_instructor || false,
          });
        }
      }

      // ファイルをデータベースに保存
      if (fileInserts.length > 0) {
        const { error: insertError } = await supabase
          .from('trn_event_archive_file')
          .insert(fileInserts);

        if (insertError) {
          throw insertError;
        }
      }

      return [];
    } catch (error) {
      console.error('ファイル保存処理エラー:', error);
      throw error;
    }
  };

  // 動画保存処理
  const saveArchiveVideos = async (
    archiveId: string,
    videos: ArchiveVideo[],
    editingArchiveId: string | null,
  ) => {
    try {
      // 編集時は既存の動画を削除
      if (editingArchiveId) {
        const { error: deleteError } = await supabase
          .from('trn_event_archive_video')
          .delete()
          .eq('archive_id', editingArchiveId);

        if (deleteError && deleteError.code !== 'PGRST116') {
          throw deleteError;
        }
      }

      // 新しい動画がなければ終了
      if (!videos || videos.length === 0) {
        return;
      }

      // 有効な動画URLを持つ動画のみをフィルタリング
      const validVideos = videos.filter((video) => video.video_url);

      if (validVideos.length === 0) {
        return;
      }

      // 動画をデータベースに保存
      const videoInserts = validVideos.map((video, index) => ({
        archive_id: archiveId,
        video_url: video.video_url,
        display_order: video.display_order || index + 1,
      }));

      const { error: insertError } = await supabase
        .from('trn_event_archive_video')
        .insert(videoInserts);

      if (insertError) {
        throw insertError;
      }

      return [];
    } catch (error) {
      console.error('動画保存処理エラー:', error);
      throw error;
    }
  };

  // ファイルをアップロードする関数
  const uploadFile = async (file: File): Promise<string> => {
    try {
      const timestamp = new Date().getTime();
      const randomId = Math.random().toString(36).substring(2, 10);
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomId}.${fileExt}`;
      const filePath = `archive_file/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event_archive_file')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('event_archive_file')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('ファイルアップロードエラー:', error);
      throw new Error('ファイルのアップロードに失敗しました');
    }
  };

  // アーカイブ画像をアップロードする関数
  const uploadArchiveImage = async (file: File): Promise<string> => {
    try {
      const timestamp = new Date().getTime();
      const randomId = Math.random().toString(36).substring(2, 10);
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomId}.${fileExt}`;
      const filePath = `archive_image/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('archive_image')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('archive_image')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('アーカイブ画像アップロードエラー:', error);
      throw new Error('アーカイブ画像のアップロードに失敗しました');
    }
  };

  // 表示グループ保存処理
  const saveVisibleGroups = async (archiveId: string, groupIds: string[]) => {
    try {
      // 既存の表示グループを削除
      const { error: deleteError } = await supabase
        .from('trn_event_archive_visible_group')
        .delete()
        .eq('archive_id', archiveId);

      if (deleteError) {
        throw deleteError;
      }

      // 新しい表示グループを保存
      if (groupIds.length > 0) {
        const groupInserts = groupIds.map((groupId) => ({
          archive_id: archiveId,
          group_id: groupId,
        }));

        const { error: insertError } = await supabase
          .from('trn_event_archive_visible_group')
          .insert(groupInserts);

        if (insertError) {
          throw insertError;
        }
      }
    } catch (error) {
      console.error('表示グループ保存処理エラー:', error);
      throw error;
    }
  };

  // キャンセル処理
  const handleCancel = () => {
    router.push(getReturnUrl());
  };

  // 削除処理
  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  // 削除確認時の処理
  const confirmDelete = async () => {
    if (!archiveId) return;

    try {
      const { error } = await supabase
        .from('mst_event_archive')
        .update({ deleted_at: new Date().toISOString() })
        .eq('archive_id', archiveId);

      if (error) throw error;

      alert('アーカイブが削除されました');
      router.push(getReturnUrl());
    } catch (error) {
      console.error('Error deleting archive:', error);
      alert('アーカイブの削除に失敗しました。');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  // 削除キャンセル時の処理
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  if (isLoading) {
    return (
      <div
        className={css({
          p: '6',
          maxW: '4xl',
          mx: 'auto',
          textAlign: 'center',
        })}
      >
        データを読み込み中...
      </div>
    );
  }

  return (
    <div className={css({ p: '6', maxW: '4xl', mx: 'auto' })}>
      <div
        className={css({
          bg: 'white',
          p: '6',
          rounded: 'md',
          mb: '6',
        })}
      >
        <h1
          className={css({
            fontSize: '2xl',
            fontWeight: 'bold',
            mb: '6',
            textAlign: 'center',
          })}
        >
          アーカイブの編集
        </h1>

        {/* 編集モードでの情報表示 */}
        <div className={css({ mb: '6', bg: 'blue.50', p: '4', rounded: 'md' })}>
          <div className={css({ fontWeight: 'medium', mb: '2' })}>
            アーカイブ情報
          </div>
          <div className={css({ fontSize: 'sm', color: 'gray.700' })}>
            独立したアーカイブ（イベントに紐づきません）
          </div>
        </div>

        <ArchiveForm
          eventId=""
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onDelete={handleDelete}
          initialData={initialData}
          isEditing={true}
          archiveTypes={archiveTypes}
          selectedArchiveType={selectedArchiveType}
          onArchiveTypeChange={setSelectedArchiveType}
          onImageUpload={uploadArchiveImage}
        />
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        itemName="アーカイブ"
        targetName={initialData?.title}
      />
    </div>
  );
}
