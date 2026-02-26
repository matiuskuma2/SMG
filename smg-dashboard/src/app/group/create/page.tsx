'use client';

import { GroupForm } from '@/components/group/GroupForm';
import type { GroupFormData } from '@/components/group/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function GroupCreatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 編集不可のグループ名のリスト
  const restrictedGroupNames = [
    '簿記講座',
    '運営',
    '講師',
    '未決済',
    '退会',
    '講師_質問受付グループ',
    '決済情報閲覧',
  ];

  const handleSubmit = async (data: GroupFormData) => {
    try {
      setIsSubmitting(true);
      const supabase = createClient();

      // グループをmst_groupテーブルに挿入
      const { data: groupData, error: groupError } = await supabase
        .from('mst_group')
        .insert({
          title: data.title,
          description: data.description,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // ユーザーが選択されている場合は、関連付けを作成
      if (data.users && data.users.length > 0) {
        const groupUserEntries = data.users.map((userId) => ({
          group_id: groupData.group_id,
          user_id: userId,
        }));

        const { error: usersError } = await supabase
          .from('trn_group_user')
          .insert(groupUserEntries);

        if (usersError) throw usersError;
      }

      // 成功時にグループ一覧画面に遷移
      router.push('/grouplist');
    } catch (error) {
      console.error('グループの作成に失敗しました:', error);
      alert('グループの作成に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // 前のページに戻る
    router.back();
  };

  return (
    <GroupForm
      isEditing={false}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
      restrictedGroupNames={restrictedGroupNames}
    />
  );
}
