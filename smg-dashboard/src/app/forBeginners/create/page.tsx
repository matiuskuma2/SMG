'use client';

import { ForBeginnersForm } from '@/components/forBeginners/ForBeginnersForm';
import type {
  ForBeginnersFormSubmitData,
  InsertBeginnerGuideFile,
} from '@/components/forBeginners/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function EventCreatePage() {
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (
    data: ForBeginnersFormSubmitData,
    isDraft = false,
  ) => {
    try {
      // まず、ガイド項目をデータベースに挿入
      const { data: insertData, error: insertError } = await supabase
        .from('mst_beginner_guide_item')
        .insert({
          title: data.title,
          description: data.description,
          display_order: 1,
          is_draft: isDraft,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Supabase挿入エラー:', insertError);
        alert(`データの保存に失敗しました: ${insertError.message}`);
        return;
      }

      const guideItemId = insertData.guide_item_id;

      // 動画URLがある場合、動画情報をデータベースに保存
      if (data.movieUrl && data.movieUrl.trim() !== '') {
        const { error: videoInsertError } = await supabase
          .from('mst_beginner_guide_video')
          .insert({
            guide_item_id: guideItemId,
            file_path: data.movieUrl.trim(),
          });

        if (videoInsertError) {
          console.error('動画URL保存エラー:', videoInsertError);
          alert(`動画URLの保存に失敗しました: ${videoInsertError.message}`);
          return;
        }
      }

      // 資料ファイルを処理（複数対応）
      for (const file of data.files) {
        if (!file.file) continue;

        // ファイル名をURL安全な形式に変換
        const originalFileName = file.file.name;
        const sanitizedFileName = originalFileName
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/_{2,}/g, '_')
          .replace(/^_|_$/g, '');

        const fileName = `${Date.now()}_${sanitizedFileName}`;
        const filePath = `guide_file/${fileName}`;

        // ファイルをストレージにアップロード
        const { error: uploadError } = await supabase.storage
          .from('beginner_guide_file')
          .upload(filePath, file.file);

        if (uploadError) {
          console.error('ファイルアップロードエラー:', uploadError);
          alert(`ファイルのアップロードに失敗しました: ${uploadError.message}`);
          return;
        }

        // 完全なURLを生成
        const { data: urlData } = supabase.storage
          .from('beginner_guide_file')
          .getPublicUrl(filePath);

        // ファイル情報をデータベースに保存
        const fileInsertData: InsertBeginnerGuideFile = {
          guide_item_id: guideItemId,
          file_path: urlData.publicUrl,
          file_name: file.file_name || file.file.name,
        };

        const { error: fileInsertError } = await supabase
          .from('mst_beginner_guide_file')
          .insert(fileInsertData);

        if (fileInsertError) {
          console.error('ファイル情報保存エラー:', fileInsertError);
          alert(`ファイル情報の保存に失敗しました: ${fileInsertError.message}`);
          return;
        }
      }

      // 成功時に一覧画面に遷移
      router.push('/forBeginnerslist');
    } catch (err) {
      console.error('予期しないエラー:', err);
      alert('予期しないエラーが発生しました');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ForBeginnersForm
      isEditing={false}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
