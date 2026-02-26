'use client';

import { RadioForm } from '@/components/radio/RadioForm';
import { revalidateRadio } from '@/lib/api/revalidate';
import { createClient } from '@/lib/supabase/client';
import type { RadioFormData } from '@/types/radio';
import { jstToUtc, utcToJst } from '@/utils/date';
import { getReturnQuery } from '@/utils/navigation';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RadioEditPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const radioId = params.radioid as string;
  const supabase = createClient();

  const [radio, setRadio] = useState<RadioFormData | null>(null);
  const [loading, setLoading] = useState(true);

  // リストページに戻る際のURL（クエリパラメータを保持）
  const getReturnUrl = () => {
    const returnQuery = getReturnQuery(searchParams);
    return returnQuery ? `/radiolist?${returnQuery}` : '/radiolist';
  };

  // ラジオデータの取得
  useEffect(() => {
    const fetchRadio = async () => {
      try {
        // ラジオデータの取得
        const { data, error } = await supabase
          .from('mst_radio')
          .select('*')
          .eq('radio_id', radioId)
          .is('deleted_at', null)
          .single();

        if (error) throw error;

        // グループデータの取得
        const { data: groupData, error: groupError } = await supabase
          .from('trn_radio_visible_group')
          .select('group_id')
          .eq('radio_id', radioId)
          .is('deleted_at', null);

        if (groupError) throw groupError;

        // グループIDの配列を作成
        const selectedGroupIds = groupData
          ? groupData.map((g) => g.group_id)
          : [];

        // 日時フォーマット変換関数（datetime-local用）
        const formatForDatetimeLocal = (
          dateString: string | null,
        ): string | undefined => {
          if (!dateString) return undefined;
          // UTC→JSTに変換してYYYY-MM-DDTHH:mm形式に
          const jstDate = utcToJst(dateString);
          return jstDate.slice(0, 16);
        };

        setRadio({
          radio_name: data.radio_name,
          image_url: data.image_url ?? undefined,
          radio_url: data.radio_url ?? undefined,
          publish_start_at: formatForDatetimeLocal(data.publish_start_at),
          publish_end_at: formatForDatetimeLocal(data.publish_end_at),
          radio_description: data.radio_description ?? undefined,
          selectedGroupIds,
          is_draft: data.is_draft ?? false,
        });
      } catch (error) {
        console.error('ラジオデータの取得エラー:', error);
        alert('ラジオデータの取得に失敗しました');
        const returnQuery = getReturnQuery(searchParams);
        router.push(returnQuery ? `/radiolist?${returnQuery}` : '/radiolist');
      } finally {
        setLoading(false);
      }
    };

    fetchRadio();
  }, [radioId, router, supabase, searchParams]);

  const handleSubmit = async (data: RadioFormData) => {
    try {
      // ラジオデータを更新
      const { error: radioError } = await supabase
        .from('mst_radio')
        .update({
          radio_name: data.radio_name,
          image_url: data.image_url || null,
          radio_url: data.radio_url || null,
          publish_start_at: data.publish_start_at
            ? jstToUtc(data.publish_start_at)
            : null,
          publish_end_at: data.publish_end_at
            ? jstToUtc(data.publish_end_at)
            : null,
          radio_description: data.radio_description || null,
          is_draft: data.is_draft ?? false,
          updated_at: new Date().toISOString(),
        })
        .eq('radio_id', radioId);

      if (radioError) throw radioError;

      // 既存のグループ関連を論理削除
      const { error: deleteError } = await supabase
        .from('trn_radio_visible_group')
        .update({ deleted_at: new Date().toISOString() })
        .eq('radio_id', radioId)
        .is('deleted_at', null);

      if (deleteError) throw deleteError;

      // 新しいグループの関連付け
      if (data.selectedGroupIds && data.selectedGroupIds.length > 0) {
        const visibleGroups = data.selectedGroupIds.map((groupId) => ({
          radio_id: radioId,
          group_id: groupId,
        }));

        const { error: groupError } = await supabase
          .from('trn_radio_visible_group')
          .insert(visibleGroups);

        if (groupError) throw groupError;
      }

      // キャッシュを再検証
      await revalidateRadio();

      alert(
        data.is_draft ? 'ラジオを下書き保存しました' : 'ラジオを更新しました',
      );
      router.push(getReturnUrl());
    } catch (error) {
      console.error('ラジオ更新エラー:', error);
      alert('ラジオの更新に失敗しました');
    }
  };

  const handleCancel = () => {
    router.push(getReturnUrl());
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (!radio) {
    return <div>ラジオが見つかりません</div>;
  }

  return (
    <RadioForm
      isEditing={true}
      initialData={radio}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
