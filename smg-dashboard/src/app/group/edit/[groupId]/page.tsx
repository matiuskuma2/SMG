'use client';

import { GroupForm } from '@/components/group/GroupForm';
import type { GroupFormData } from '@/components/group/types';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function GroupEditPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<GroupFormData | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        // グループ情報を取得
        const { data: groupData, error: groupError } = await supabase
          .from('mst_group')
          .select('*')
          .eq('group_id', groupId)
          .is('deleted_at', null)
          .single();

        if (groupError) throw groupError;

        // グループに所属するユーザーIDを取得
        const { data: userIds, error: userError } = await supabase
          .from('trn_group_user')
          .select('user_id')
          .eq('group_id', groupId)
          .is('deleted_at', null);

        if (userError) throw userError;

        const groupFormData = {
          group_id: groupData.group_id,
          title: groupData.title,
          description: groupData.description,
          users: userIds.map((item) => item.user_id),
          created_at: groupData.created_at,
          updated_at: groupData.updated_at,
        };

        console.log('=== 取得したグループデータ ===');
        console.log('groupData:', groupData);
        console.log('groupFormData:', groupFormData);
        console.log('========================');

        setGroup(groupFormData);
      } catch (error) {
        console.error('グループデータの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId]);

  const handleSubmit = async (data: GroupFormData) => {
    try {
      setIsSubmitting(true);
      const supabase = createClient();

      // グループ情報を更新
      const { error: updateError } = await supabase
        .from('mst_group')
        .update({
          title: data.title,
          description: data.description,
          updated_at: new Date().toISOString(),
        })
        .eq('group_id', groupId);

      if (updateError) throw updateError;

      // 現在のユーザー関連付けを取得
      const { data: currentUsers, error: fetchError } = await supabase
        .from('trn_group_user')
        .select('user_id')
        .eq('group_id', groupId)
        .is('deleted_at', null);

      if (fetchError) throw fetchError;

      const currentUserIds = currentUsers.map((item) => item.user_id);

      // 削除すべきユーザー（現在存在するが、新しいリストにない）
      const userIdsToRemove = currentUserIds.filter(
        (id) => !data.users.includes(id),
      );

      // 追加すべきユーザー（新しいリストにあるが、現在存在しない）
      const userIdsToAdd = data.users.filter(
        (id) => !currentUserIds.includes(id),
      );

      // 削除するユーザーの関連付けを論理削除
      if (userIdsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('trn_group_user')
          .update({ deleted_at: new Date().toISOString() })
          .eq('group_id', groupId)
          .in('user_id', userIdsToRemove);

        if (removeError) throw removeError;
      }

      // 追加するユーザーの関連付けを作成
      if (userIdsToAdd.length > 0) {
        const newEntries = userIdsToAdd.map((userId) => ({
          group_id: groupId,
          user_id: userId,
        }));

        const { error: addError } = await supabase
          .from('trn_group_user')
          .insert(newEntries);

        if (addError) throw addError;
      }

      router.push('/grouplist');
    } catch (error) {
      console.error('グループの更新に失敗しました:', error);
      alert('グループの更新に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return <div className="p-6 text-center">読み込み中...</div>;
  }

  if (!group) {
    return (
      <div className="p-6 text-center">グループが見つかりませんでした</div>
    );
  }

  // デバッグログを追加
  const isEditable = !restrictedGroupNames.includes(group.title);
  console.log('=== グループ編集デバッグ情報 ===');
  console.log('グループタイトル:', group.title);
  console.log('制限されたグループ名:', restrictedGroupNames);
  console.log(
    'タイトルが制限リストに含まれるか:',
    restrictedGroupNames.includes(group.title),
  );
  console.log('編集可能かどうか:', isEditable);
  console.log('==========================');

  return (
    <GroupForm
      isEditing={true}
      initialData={group}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
      isGroupNameEditable={isEditable}
      restrictedGroupNames={restrictedGroupNames}
    />
  );
}
