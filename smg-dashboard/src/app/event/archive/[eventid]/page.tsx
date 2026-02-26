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
import { jstToUtc, utcToJst } from '@/utils/date';
import { getReturnQuery } from '@/utils/navigation';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EventArchivePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = params.eventid as string;
  const archiveId = searchParams.get('archiveId');
  const isEditing = !!archiveId;
  const supabase = createClient();

  // リストページに戻る際のURL（クエリパラメータを保持）
  const getReturnUrl = () => {
    const returnQuery = getReturnQuery(searchParams);
    return returnQuery ? `/archive?${returnQuery}` : '/archive';
  };

  const [eventType, setEventType] = useState<string | null>(null);
  const [eventTypeName, setEventTypeName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<ArchiveFormData | undefined>(
    undefined,
  );
  const [themes, setThemes] = useState<
    Array<{ theme_id: string; theme_name: string }>
  >([]);

  // 削除モーダル用の状態
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // イベントタイプの取得
        const { data: eventData, error: eventError } = await supabase
          .from('mst_event')
          .select('event_type, mst_event_type!inner(event_type_name)')
          .eq('event_id', eventId)
          .is('deleted_at', null)
          .single();

        if (eventError) {
          throw eventError;
        }

        if (eventData) {
          setEventType(eventData.event_type);
          // event_type_nameを取得
          const eventTypeData = eventData.mst_event_type as {
            event_type_name: string;
          };
          setEventTypeName(eventTypeData.event_type_name);
        }

        // テーマ一覧の取得
        const { data: themeData, error: themeError } = await supabase
          .from('mst_theme')
          .select('theme_id, theme_name')
          .is('deleted_at', null)
          .order('created_at', { ascending: true });

        if (themeError) {
          console.error('テーマ取得エラー:', themeError);
        } else if (themeData) {
          setThemes(themeData);
        }

        // イベントの表示グループを取得（新規作成・編集共通）
        const { data: eventVisibleGroupData, error: eventVisibleGroupError } =
          await supabase
            .from('trn_event_visible_group')
            .select('group_id')
            .eq('event_id', eventId)
            .is('deleted_at', null);

        if (
          eventVisibleGroupError &&
          eventVisibleGroupError.code !== 'PGRST116'
        ) {
          console.error(
            'イベント表示グループ取得エラー:',
            eventVisibleGroupError,
          );
        }

        const visibleGroupIds =
          eventVisibleGroupData?.map((item) => item.group_id) || [];

        // 編集モードの場合、アーカイブデータを取得
        if (isEditing && archiveId) {
          const { data: archiveData, error: archiveError } = await supabase
            .from('mst_event_archive')
            .select('*')
            .eq('archive_id', archiveId)
            .is('deleted_at', null)
            .single();

          if (archiveError) {
            throw archiveError;
          }

          // ファイルデータの取得
          const { data: fileData, error: fileError } = await supabase
            .from('trn_event_archive_file')
            .select('*, theme_id, is_sawabe_instructor')
            .eq('archive_id', archiveId)
            .is('deleted_at', null)
            .order('display_order', { ascending: true });

          if (fileError) {
            throw fileError;
          }

          // 動画データの取得
          const { data: videoData, error: videoError } = await supabase
            .from('trn_event_archive_video')
            .select('*, theme_id, is_sawabe_instructor')
            .eq('archive_id', archiveId)
            .is('deleted_at', null)
            .order('display_order', { ascending: true });

          if (videoError && videoError.code !== 'PGRST116') {
            // PGRST116はレコードが見つからないエラー
            throw videoError;
          }

          // 初期データの設定
          // UTCから日本時間に変換
          setInitialData({
            title: archiveData.title || '',
            description: archiveData.description || '',
            publish_start_at: archiveData.publish_start_at
              ? utcToJst(archiveData.publish_start_at)
              : '',
            publish_end_at: archiveData.publish_end_at
              ? utcToJst(archiveData.publish_end_at)
              : '',
            files:
              fileData?.map((file) => ({
                file_id: file.file_id,
                archive_id: file.archive_id,
                file_url: file.file_url,
                file_name: file.file_name,
                display_order: file.display_order,
                created_at: file.created_at,
                updated_at: file.updated_at,
                deleted_at: file.deleted_at,
                theme_id: file.theme_id,
                is_sawabe_instructor: file.is_sawabe_instructor,
              })) || [],
            videos:
              videoData?.map((video) => ({
                video_id: video.video_id,
                archive_id: video.archive_id,
                video_url: video.video_url,
                video_image_url: video.video_image_url,
                display_order: video.display_order,
                created_at: video.created_at,
                updated_at: video.updated_at,
                deleted_at: video.deleted_at,
                theme_id: video.theme_id,
                is_sawabe_instructor: video.is_sawabe_instructor,
              })) || [],
            event_id: eventId,
            event_type_id: eventType || '',
            type_id: archiveData.type_id || null,
            is_draft: archiveData.is_draft,
            created_at: null,
            updated_at: null,
            deleted_at: null,
            visible_group_ids: visibleGroupIds,
            image_url: archiveData.image_url || null,
            notification_sent: archiveData.notification_sent ?? false,
          });
        } else {
          // 新規作成モードの場合、イベントの表示グループのみ設定
          setInitialData({
            title: '',
            description: '',
            publish_start_at: '',
            publish_end_at: '',
            files: [],
            videos: [],
            event_id: eventId,
            event_type_id: eventType || '',
            type_id: null,
            is_draft: false,
            created_at: null,
            updated_at: null,
            deleted_at: null,
            visible_group_ids: visibleGroupIds,
            image_url: null,
            notification_sent: false,
          });
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
        alert('データの取得に失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [eventId, archiveId, isEditing, supabase, eventType]);

  // フォーム送信処理
  const handleSubmit = async (data: ArchiveFormData) => {
    try {
      console.log('handleSubmit開始:', {
        files: data.files,
        filesLength: data.files.length,
      });

      // イベント情報が取得できていない場合は処理を中断
      if (!eventType) {
        alert('イベント情報の取得に失敗しました。');
        return;
      }

      // 日本時間からUTCに変換
      const publish_start_at = data.publish_start_at
        ? jstToUtc(data.publish_start_at)
        : null;
      const publish_end_at = data.publish_end_at
        ? jstToUtc(data.publish_end_at)
        : null;

      let savedArchiveId: string;

      if (isEditing && archiveId) {
        // 更新処理
        const { data: updateData, error: updateError } = await supabase
          .from('mst_event_archive')
          .update({
            title: data.title,
            description: data.description,
            event_type_id: eventType,
            publish_start_at: publish_start_at,
            publish_end_at: publish_end_at,
            is_draft: data.is_draft || false,
            image_url: data.image_url || null,
          })
          .eq('archive_id', archiveId)
          .select()
          .single();

        if (updateError) {
          console.error('アーカイブ更新エラー:', {
            message: updateError.message,
            code: updateError.code,
            details: updateError.details,
            hint: updateError.hint,
            data,
          });
          throw new Error(
            `アーカイブの更新に失敗しました: ${updateError.message}`,
          );
        }

        if (!updateData) {
          throw new Error(
            'アーカイブの更新に失敗しました: データが見つかりません',
          );
        }

        savedArchiveId = updateData.archive_id;
      } else {
        // 新規作成処理
        const { data: archiveData, error } = await supabase
          .from('mst_event_archive')
          .insert({
            title: data.title,
            description: data.description,
            event_id: eventId,
            event_type_id: eventType,
            publish_start_at: publish_start_at,
            publish_end_at: publish_end_at,
            is_draft: data.is_draft || false,
            image_url: data.image_url || null,
          })
          .select();

        if (error) {
          console.error('アーカイブ作成エラー:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            data,
          });
          throw error;
        }

        if (!archiveData || archiveData.length === 0) {
          throw new Error(
            'アーカイブの作成に失敗しました: データが見つかりません',
          );
        }

        savedArchiveId = archiveData[0].archive_id;
      }

      console.log('アーカイブID確定:', savedArchiveId);

      // ファイル保存処理
      await saveArchiveFiles(savedArchiveId, data.files);

      // 動画処理
      await saveArchiveVideos(
        savedArchiveId,
        data.videos,
        isEditing && archiveId ? archiveId : null,
      );

      // イベント表示グループ保存処理
      await saveEventVisibleGroups(eventId, data.visible_group_ids || []);

      // キャッシュを再検証
      await revalidateArchive();

      alert(
        data.is_draft
          ? '下書き保存が完了しました'
          : isEditing
            ? 'アーカイブが更新されました'
            : 'アーカイブが作成されました',
      );

      // 送信成功後、一覧ページに戻る
      router.push(getReturnUrl());
    } catch (error) {
      console.error('アーカイブ処理エラー:', {
        message: error instanceof Error ? error.message : '不明なエラー',
        error,
        formData: data,
      });
      alert(
        isEditing
          ? 'アーカイブの更新に失敗しました。'
          : 'アーカイブの作成に失敗しました。\n詳細はコンソールを確認してください。',
      );
      throw error;
    }
  };

  // ファイル保存処理
  const saveArchiveFiles = async (archiveId: string, files: ArchiveFile[]) => {
    try {
      console.log('saveArchiveFiles開始:', {
        archiveId,
        files,
        filesLength: files.length,
      });

      // 既存のファイルを削除
      const { error: deleteError } = await supabase
        .from('trn_event_archive_file')
        .delete()
        .eq('archive_id', archiveId);

      if (deleteError) {
        console.error('ファイル削除エラー:', {
          message: deleteError.message,
          code: deleteError.code,
          details: deleteError.details,
          hint: deleteError.hint,
        });
        throw deleteError;
      }

      // 新しいファイルがなければ終了
      if (!files || files.length === 0) {
        console.log('保存するファイルがありません');
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
            file_name: file.file.name,
            display_order: file.display_order || fileInserts.length + 1,
            theme_id: file.theme_id || null,
            is_sawabe_instructor: file.is_sawabe_instructor || false,
          });
        }
      }

      // ファイルをデータベースに保存
      if (fileInserts.length > 0) {
        console.log('保存するファイルデータ:', fileInserts);

        const { data, error: insertError } = await supabase
          .from('trn_event_archive_file')
          .insert(fileInserts)
          .select();

        if (insertError) {
          console.error('ファイル保存エラー:', {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
          });
          throw insertError;
        }

        console.log('ファイル保存成功:', data);
        return data;
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
      console.log('saveArchiveVideos開始:', {
        archiveId,
        videos,
        videosLength: videos.length,
      });

      // 編集時は既存の動画を削除
      if (editingArchiveId) {
        const { error: deleteError } = await supabase
          .from('trn_event_archive_video')
          .delete()
          .eq('archive_id', editingArchiveId);

        if (deleteError && deleteError.code !== 'PGRST116') {
          console.error('動画削除エラー:', {
            message: deleteError.message,
            code: deleteError.code,
            details: deleteError.details,
            hint: deleteError.hint,
          });
          throw deleteError;
        }
      }

      // 新しい動画がなければ終了
      if (!videos || videos.length === 0) {
        console.log('保存する動画がありません');
        return;
      }

      // 有効な動画URLを持つ動画のみをフィルタリング
      const validVideos = videos.filter((video) => video.video_url);

      if (validVideos.length === 0) {
        console.log('有効な動画URLがありません');
        return;
      }

      // 動画をデータベースに保存
      const videoInserts = validVideos.map((video, index) => ({
        archive_id: archiveId,
        video_url: video.video_url,
        display_order: video.display_order || index + 1,
        theme_id: video.theme_id || null,
        is_sawabe_instructor: video.is_sawabe_instructor || false,
      }));

      console.log('保存する動画データ:', videoInserts);

      const { data, error: insertError } = await supabase
        .from('trn_event_archive_video')
        .insert(videoInserts)
        .select();

      if (insertError) {
        console.error('動画保存エラー:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
        });
        throw insertError;
      }

      console.log('動画保存成功:', data);
      return data;
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

      console.log('ファイルアップロード開始:', {
        fileName: file.name,
        filePath,
      });

      const { error: uploadError } = await supabase.storage
        .from('event_archive_file')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('ファイルアップロードエラー:', uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('event_archive_file')
        .getPublicUrl(filePath);

      console.log('ファイルアップロード成功:', urlData.publicUrl);
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

  // イベント表示グループ保存処理
  const saveEventVisibleGroups = async (
    eventId: string,
    groupIds: string[],
  ) => {
    try {
      console.log('イベント表示グループ保存開始:', {
        eventId,
        groupIds,
        groupIdsLength: groupIds.length,
      });

      // 既存のイベント表示グループを削除
      const { error: deleteError } = await supabase
        .from('trn_event_visible_group')
        .delete()
        .eq('event_id', eventId);

      if (deleteError) {
        console.error('イベント表示グループ削除エラー:', deleteError);
        throw deleteError;
      }

      // 新しい表示グループを保存
      if (groupIds.length > 0) {
        const groupInserts = groupIds.map((groupId) => ({
          event_id: eventId,
          group_id: groupId,
        }));

        console.log('保存するグループデータ:', groupInserts);

        const { error: insertError } = await supabase
          .from('trn_event_visible_group')
          .insert(groupInserts);

        if (insertError) {
          console.error('イベント表示グループ保存エラー:', insertError);
          throw insertError;
        }
      }

      console.log('イベント表示グループ保存成功:', groupIds);
    } catch (error) {
      console.error('イベント表示グループ保存処理エラー:', error);
      throw error;
    }
  };

  // キャンセル処理
  const handleCancel = () => {
    router.back();
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
          {isEditing ? 'イベントアーカイブの編集' : 'イベントアーカイブの作成'}
        </h1>

        <ArchiveForm
          eventId={eventId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onDelete={isEditing ? handleDelete : undefined}
          initialData={initialData}
          isEditing={isEditing}
          themes={eventTypeName === '定例会' ? themes : []}
          isEventArchive={true}
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
