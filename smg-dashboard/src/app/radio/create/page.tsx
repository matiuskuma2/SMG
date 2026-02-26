'use client';

import { RadioForm } from '@/components/radio/RadioForm';
import { createClient } from '@/lib/supabase/client';
import type { RadioFormData } from '@/types/radio';
import { jstToUtc } from '@/utils/date';
import { useRouter } from 'next/navigation';

export default function RadioCreatePage() {
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (data: RadioFormData) => {
    try {
      // ラジオデータを挿入
      const { data: radioData, error: radioError } = await supabase
        .from('mst_radio')
        .insert({
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
        })
        .select()
        .single();

      if (radioError) throw radioError;

      // グループの関連付け
      if (data.selectedGroupIds && data.selectedGroupIds.length > 0) {
        const visibleGroups = data.selectedGroupIds.map((groupId) => ({
          radio_id: radioData.radio_id,
          group_id: groupId,
        }));

        const { error: groupError } = await supabase
          .from('trn_radio_visible_group')
          .insert(visibleGroups);

        if (groupError) throw groupError;
      }

      alert(
        data.is_draft ? 'ラジオを下書き保存しました' : 'ラジオを作成しました',
      );
      router.push('/radiolist');
    } catch (error) {
      console.error('ラジオ作成エラー:', error);
      alert('ラジオの作成に失敗しました');
    }
  };

  const handleCancel = () => {
    router.push('/radiolist');
  };

  return (
    <RadioForm
      isEditing={false}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
