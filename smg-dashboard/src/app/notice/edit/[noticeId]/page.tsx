'use client';

import { NoticeForm } from '@/components/notice/NoticeForm';
import type { NoticeFile, NoticeFormData } from '@/components/notice/types';
import { createClient } from '@/lib/supabase/client';
import { getReturnQuery } from '@/utils/navigation';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NoticeEditPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const noticeId = params.noticeId as string;

  // ステート定義
  const [notice, setNotice] = useState<NoticeFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // リストページに戻る際のURL（クエリパラメータを保持）
  const getReturnUrl = () => {
    const returnQuery = getReturnQuery(searchParams);
    return returnQuery ? `/noticelist?${returnQuery}` : '/noticelist';
  };

  // お知らせデータの取得
  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const { data, error } = await supabase
          .from('mst_notice')
          .select('*')
          .eq('notice_id', noticeId)
          .is('deleted_at', null)
          .single();

        if (error) {
          console.error('Error fetching notice:', error);
          setError('お知らせの取得に失敗しました');
          return;
        }

        if (!data) {
          setError('お知らせが見つかりませんでした');
          return;
        }

        // 表示グループを取得
        const { data: groupData } = await supabase
          .from('trn_notice_visible_group')
          .select('group_id')
          .eq('notice_id', noticeId);

        const visibleGroupIds = groupData?.map((item) => item.group_id) || [];

        // お知らせファイルを取得
        const { data: fileData, error: fileError } = await supabase
          .from('trn_notice_file')
          .select('file_id, file_url, file_name, display_order')
          .eq('notice_id', noticeId)
          .is('deleted_at', null)
          .order('display_order');

        if (fileError) {
          console.error('Error fetching notice files:', fileError);
        }

        // ファイルデータをNoticeFile型に変換
        const noticeFiles: NoticeFile[] = fileData
          ? fileData.map((file) => ({
              file_id: file.file_id,
              notice_id: noticeId,
              file_url: file.file_url,
              file_name: file.file_name,
              display_order: file.display_order,
              file: null,
              isNew: false,
            }))
          : [];

        // データをNoticeFormData型に変換
        const noticeData: NoticeFormData = {
          notice_id: data.notice_id,
          title: data.title,
          content: data.content,
          category_id: data.category_id,
          publish_start_at: data.publish_start_at
            ? new Date(data.publish_start_at).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16),
          publish_end_at: data.publish_end_at
            ? new Date(data.publish_end_at).toISOString().slice(0, 16)
            : null,
          visible_group_ids: visibleGroupIds,
          files: noticeFiles,
        };

        setNotice(noticeData);
      } catch (error) {
        console.error('Error in fetchNotice:', error);
        setError('お知らせの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchNotice();
  }, [noticeId, supabase]);

  const handleSubmit = async (data: NoticeFormData, isDraft = false) => {
    try {
      setLoading(true);

      // データをSupabaseの形式に変換
      const updateData = {
        title: data.title,
        content: data.content,
        category_id: data.category_id || null,
        publish_start_at: data.publish_start_at
          ? new Date(data.publish_start_at).toISOString()
          : null,
        publish_end_at: data.publish_end_at
          ? new Date(data.publish_end_at).toISOString()
          : null,
        is_draft: isDraft,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('mst_notice')
        .update(updateData)
        .eq('notice_id', noticeId);

      if (error) {
        console.error('Error updating notice:', error);
        setError('お知らせの更新に失敗しました');
        return;
      }

      // 既存の表示グループを削除
      const { error: deleteError } = await supabase
        .from('trn_notice_visible_group')
        .delete()
        .eq('notice_id', noticeId);

      if (deleteError) {
        console.error('Error deleting notice groups:', deleteError);
        setError('表示グループの更新に失敗しました');
        return;
      }

      // 新しい表示グループを保存
      if (data.visible_group_ids && data.visible_group_ids.length > 0) {
        const noticeGroupData = data.visible_group_ids.map((groupId) => ({
          notice_id: noticeId,
          group_id: groupId,
        }));

        const { error: groupError } = await supabase
          .from('trn_notice_visible_group')
          .insert(noticeGroupData);

        if (groupError) {
          console.error('Error creating notice groups:', groupError);
          setError('表示グループの設定に失敗しました');
          return;
        }
      }

      // ファイルを保存（あれば）
      if (data.files && data.files.length > 0) {
        // まず既存のすべてのファイルを論理削除
        await supabase
          .from('trn_notice_file')
          .update({ deleted_at: new Date().toISOString() })
          .eq('notice_id', noticeId)
          .is('deleted_at', null);

        // 新しいファイルを保存
        for (const file of data.files) {
          let fileUrl = file.file_url;

          // 新しいファイルがアップロードされた場合
          if (file.file) {
            const fileExt = file.file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `notice_file/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('notice_file')
              .upload(filePath, file.file);

            if (uploadError) {
              console.error('Error uploading file:', uploadError);
              setError('ファイルのアップロードに失敗しました');
              return;
            }

            const { data: urlData } = supabase.storage
              .from('notice_file')
              .getPublicUrl(filePath);

            if (urlData) {
              fileUrl = urlData.publicUrl;
            }
          }

          if (fileUrl) {
            const fileData = {
              notice_id: noticeId,
              file_name: file.file_name ?? file.file?.name ?? '',
              file_url: fileUrl,
              display_order: file.display_order,
            };

            // 既存のファイルがある場合は更新、なければ挿入
            if (file.file_id && !file.file_id.startsWith('temp-')) {
              await supabase
                .from('trn_notice_file')
                .update({
                  ...fileData,
                  updated_at: new Date().toISOString(),
                  deleted_at: null,
                })
                .eq('file_id', file.file_id);
            } else {
              await supabase.from('trn_notice_file').insert([fileData]);
            }
          }
        }
      }

      // 成功時に一覧画面に遷移
      router.push(getReturnUrl());
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError('お知らせの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // 前のページに戻る
    router.push(getReturnUrl());
  };

  if (loading) {
    return <div className="p-6 text-center">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        {error}
        <button
          type="button"
          onClick={handleCancel}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          戻る
        </button>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="p-6 text-center">
        お知らせが見つかりませんでした
        <button
          type="button"
          onClick={handleCancel}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          戻る
        </button>
      </div>
    );
  }

  return (
    <NoticeForm
      isEditing={true}
      initialData={notice}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
    />
  );
}
