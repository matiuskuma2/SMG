'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ForBeginnersForm } from '@/components/forBeginners/ForBeginnersForm';
import type {
  BeginnerGuideFile,
  ForBeginnersFormSubmitData,
  InsertBeginnerGuideFile,
  PartialForBeginnersFormData,
} from '@/components/forBeginners/types';
import { revalidateForBeginners } from '@/lib/api/revalidate';
import { createClient } from '@/lib/supabase/client';
import { getReturnQuery } from '@/utils/navigation';

export default function ForBeginnersEditPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const supabase = createClient();

  // リストページに戻る際のURL（クエリパラメータを保持）
  const getReturnUrl = () => {
    const returnQuery = getReturnQuery(searchParams);
    return returnQuery
      ? `/forBeginnerslist?${returnQuery}`
      : '/forBeginnerslist';
  };

  // ステート定義
  const [event, setEvent] = useState<PartialForBeginnersFormData | null>(null);
  const [loading, setLoading] = useState(true);
  // 既存ファイルIDを保持（差分検出用）
  const [originalFileIds, setOriginalFileIds] = useState<string[]>([]);

  // イベントデータの取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        // ガイド項目を取得
        const { data: guideData, error: guideError } = await supabase
          .from('mst_beginner_guide_item')
          .select('*')
          .eq('guide_item_id', id)
          .is('deleted_at', null)
          .single();

        if (guideError) {
          console.error('データ取得エラー:', guideError);
          setEvent(null);
          setLoading(false);
          return;
        }

        // 関連ファイルを取得
        const { data: fileData, error: fileError } = await supabase
          .from('mst_beginner_guide_file')
          .select('*')
          .eq('guide_item_id', id)
          .is('deleted_at', null);

        if (fileError) {
          console.error('ファイルデータ取得エラー:', fileError);
        }

        // 動画データを取得
        const { data: videoData, error: videoError } = await supabase
          .from('mst_beginner_guide_video')
          .select('*')
          .eq('guide_item_id', id)
          .is('deleted_at', null);

        if (videoError) {
          console.error('動画データ取得エラー:', videoError);
        }

        // ファイルデータをBeginnerGuideFile型に変換
        const initialFiles: BeginnerGuideFile[] = fileData
          ? fileData.map((file, index) => ({
              file_id: file.file_id,
              guide_item_id: file.guide_item_id,
              file_path: file.file_path,
              file_name: file.file_name,
              display_order: index + 1,
              created_at: file.created_at,
              updated_at: file.updated_at,
              deleted_at: file.deleted_at,
            }))
          : [];

        // 既存ファイルIDを保持
        setOriginalFileIds(initialFiles.map((f) => f.file_id));

        // データを整形
        const eventData: PartialForBeginnersFormData = {
          guide_item_id: guideData.guide_item_id,
          title: guideData.title,
          description: guideData.description || '',
          movieUrl:
            videoData && videoData.length > 0 ? videoData[0].file_path : '',
          files: initialFiles,
        };

        setEvent(eventData);
      } catch (error) {
        console.error('予期しないエラー:', error);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, supabase]);

  const handleSubmit = async (
    data: ForBeginnersFormSubmitData,
    isDraft = false,
  ) => {
    try {
      // ガイド項目を更新
      const { error: updateError } = await supabase
        .from('mst_beginner_guide_item')
        .update({
          title: data.title,
          description: data.description,
          is_draft: isDraft,
          updated_at: new Date().toISOString(),
        })
        .eq('guide_item_id', id);

      if (updateError) {
        console.error('データ更新エラー:', updateError);
        alert(`データの更新に失敗しました: ${updateError.message}`);
        return;
      }

      // === 動画URL処理 ===
      // 既存の動画データを論理削除
      const { error: videoDeleteError } = await supabase
        .from('mst_beginner_guide_video')
        .update({ deleted_at: new Date().toISOString() })
        .eq('guide_item_id', id);

      if (videoDeleteError) {
        console.error('既存動画データ削除エラー:', videoDeleteError);
      }

      // 新しい動画URLがある場合、挿入
      if (data.movieUrl && data.movieUrl.trim() !== '') {
        const { error: videoInsertError } = await supabase
          .from('mst_beginner_guide_video')
          .insert({
            guide_item_id: id,
            file_path: data.movieUrl.trim(),
          });

        if (videoInsertError) {
          console.error('動画URL保存エラー:', videoInsertError);
          alert(`動画URLの保存に失敗しました: ${videoInsertError.message}`);
          return;
        }
      }

      // === 資料ファイル処理 ===
      // 送信されたファイルのIDリスト（既存ファイルのみ）
      const submittedFileIds = data.files
        .filter((f) => f.file_id && f.file_id !== '')
        .map((f) => f.file_id);

      // 削除されたファイルを論理削除
      const deletedFileIds = originalFileIds.filter(
        (fileId) => !submittedFileIds.includes(fileId),
      );
      if (deletedFileIds.length > 0) {
        const { error: fileDeleteError } = await supabase
          .from('mst_beginner_guide_file')
          .update({ deleted_at: new Date().toISOString() })
          .in('file_id', deletedFileIds);

        if (fileDeleteError) {
          console.error('ファイル削除エラー:', fileDeleteError);
        }
      }

      // 各ファイルを処理
      for (const file of data.files) {
        if (file.file) {
          // 新規ファイル: ストレージアップロード + DB保存
          const originalFileName = file.file.name;
          const sanitizedFileName = originalFileName
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_|_$/g, '');

          const fileName = `${Date.now()}_${sanitizedFileName}`;
          const filePath = `guide_file/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('beginner_guide_file')
            .upload(filePath, file.file);

          if (uploadError) {
            console.error('ファイルアップロードエラー:', uploadError);
            alert(
              `ファイルのアップロードに失敗しました: ${uploadError.message}`,
            );
            return;
          }

          const { data: urlData } = supabase.storage
            .from('beginner_guide_file')
            .getPublicUrl(filePath);

          const fileInsertData: InsertBeginnerGuideFile = {
            guide_item_id: id,
            file_path: urlData.publicUrl,
            file_name: file.file_name || file.file.name,
          };

          const { error: fileInsertError } = await supabase
            .from('mst_beginner_guide_file')
            .insert(fileInsertData);

          if (fileInsertError) {
            console.error('ファイル情報保存エラー:', fileInsertError);
            alert(
              `ファイル情報の保存に失敗しました: ${fileInsertError.message}`,
            );
            return;
          }
        } else if (file.file_id && submittedFileIds.includes(file.file_id)) {
          // 既存ファイル: file_nameが変更されていれば更新
          const { error: fileUpdateError } = await supabase
            .from('mst_beginner_guide_file')
            .update({
              file_name: file.file_name,
              updated_at: new Date().toISOString(),
            })
            .eq('file_id', file.file_id);

          if (fileUpdateError) {
            console.error('ファイル名更新エラー:', fileUpdateError);
          }
        }
      }

      // キャッシュを再検証
      await revalidateForBeginners();

      // 成功時に一覧画面に遷移
      router.push(getReturnUrl());
    } catch (error) {
      console.error('予期しないエラー:', error);
      alert('予期しないエラーが発生しました');
    }
  };

  const handleCancel = () => {
    router.push(getReturnUrl());
  };

  if (loading) {
    return <div className="p-6 text-center">読み込み中...</div>;
  }

  if (!event) {
    return (
      <div className="p-6 text-center">イベントが見つかりませんでした</div>
    );
  }

  return (
    <ForBeginnersForm
      isEditing={true}
      initialData={event}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
