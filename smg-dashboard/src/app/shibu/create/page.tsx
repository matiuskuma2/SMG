'use client';

import { NoticeForm } from '@/components/notice/NoticeForm';
import type { NoticeFormData } from '@/components/notice/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ShibuCreatePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: NoticeFormData, isDraft = false) => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      const insertData = {
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: insertedNotice, error } = await supabase
        .from('mst_notice')
        .insert(insertData)
        .select('notice_id')
        .single();

      if (error) {
        console.error('Error creating shibu notice:', error);
        setError('支部投稿の作成に失敗しました');
        return;
      }

      // 表示グループの保存
      if (data.visible_group_ids && data.visible_group_ids.length > 0) {
        const noticeGroupData = data.visible_group_ids.map((groupId) => ({
          notice_id: insertedNotice.notice_id,
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

      // ファイル保存
      if (data.files && data.files.length > 0) {
        for (const file of data.files) {
          let fileUrl = file.file_url;

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
              notice_id: insertedNotice.notice_id,
              file_name: file.file_name ?? file.file?.name ?? '',
              file_url: fileUrl,
              display_order: file.display_order,
            };

            const { error: fileError } = await supabase
              .from('trn_notice_file')
              .insert([fileData]);

            if (fileError) {
              console.error('Error saving file data:', fileError);
              setError('ファイルデータの保存に失敗しました');
              return;
            }
          }
        }
      }

      router.push('/shibulist');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError('支部投稿の作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

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

  return (
    <NoticeForm
      isEditing={false}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
      categoryType="shibu"
      formLabel="支部投稿"
    />
  );
}
