'use client';

import { GroupCard } from '@/components/grouplist/GroupCard';
import { GroupListHeader } from '@/components/grouplist/GroupListHeader';
import { GroupTable } from '@/components/grouplist/GroupTable';
import { AddUserToGroupModal } from '@/components/grouplist/GroupUserModal';
import type { Group } from '@/components/grouplist/types';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import type { User } from '@/components/userlist/types';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

// Groups that cannot be deleted
const UNDELETABLE_GROUP_NAMES = [
  '講師',
  '運営',
  '簿記講座',
  '未決済',
  '講師_質問受付グループ',
  '退会',
  '決済情報閲覧',
] as const;

// Supabaseのレスポンス型を定義
interface SupabaseGroupUser {
  user_id: string;
  mst_user: {
    user_id: string;
    username: string;
    email: string;
    phone_number: string;
    company_name: string;
    created_at: string;
    updated_at: string;
  };
}

interface SupabaseUser {
  user_id: string;
  username: string;
  email: string;
  phone_number: string;
  company_name: string;
  user_type: string;
  created_at: string;
  updated_at: string;
}

const GroupListContent = () => {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // モーダル用の状態を追加
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGroupForUsers, setSelectedGroupForUsers] = useState<
    string | null
  >(null);

  // UTCから日本時間に変換する関数
  const convertToJST = useCallback((utcDate: string) => {
    if (!utcDate) return '';
    const date = new Date(utcDate);
    return new Date(date.getTime() + 9 * 60 * 60 * 1000).toLocaleString(
      'ja-JP',
    );
  }, []);

  // ユーザーデータをSupabase形式からアプリ形式に変換する関数
  const convertUserData = useCallback(
    (userData: SupabaseUser): User => {
      return {
        // MstUserの必須フィールド
        user_id: userData.user_id,
        email: userData.email,

        // MstUserのオプショナルフィールド（nullableなフィールド）
        bio: null,
        birth_date: null,
        company_address: null,
        company_name: userData.company_name || null,
        company_name_kana: null,
        created_at: userData.created_at,
        daihyosha_id: null,
        deleted_at: null,
        icon: null,
        industry_id: null,
        invite_link: null,
        is_birth_date_visible: null,
        is_company_address_visible: null,
        is_company_name_kana_visible: null,
        is_email_visible: null,
        is_phone_number_visible: null,
        is_user_name_kana_visible: null,
        is_user_type_visible: null,
        is_user_position_visible: null,
        is_bio_visible: null,
        is_company_name_visible: null,
        is_industry_id_visible: null,
        is_nickname_visible: null,
        is_profile_public: null,
        is_sns_visible: null,
        is_username_visible: null,
        is_website_url_visible: null,
        last_login_at: userData.updated_at,
        last_payment_date: null,
        nickname: null,
        phone_number: userData.phone_number || null,
        social_media_links: null,
        updated_at: userData.updated_at,
        user_name_kana: null,
        user_position: null,
        user_type: userData.user_type || null,
        username: userData.username || null,
        website_url: null,
        building_name: null,
        city_address: null,
        my_asp_user_id: null,
        postal_code: null,
        prefecture: null,

        // フロントエンド用の追加フィールド（下位互換性のため）
        id: userData.user_id,
        displayName: userData.username || '',
        memberNumber: '',
        role: 'パートナー',
        groups: [],
        joinedDate: convertToJST(userData.created_at),
        lastAccess: convertToJST(userData.updated_at),
        updatedAt: convertToJST(userData.updated_at),
        companyName: userData.company_name || '',
        company: userData.company_name || '',
        profileImage: '',
        userName: userData.username || '',
        phoneNumber: userData.phone_number || '',
        createdAt: convertToJST(userData.created_at),
        companyNameKana: '',
      };
    },
    [convertToJST],
  );

  // ユーザーデータの取得
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('mst_user')
          .select('*')
          .is('deleted_at', null);

        if (error) throw error;

        // SupabaseUser型に明示的にキャスト
        const usersData = data as unknown as SupabaseUser[];

        // User型に変換
        const formattedUsers = usersData.map(convertUserData);
        setAllUsers(formattedUsers);
      } catch (error) {
        console.error('ユーザーデータの取得に失敗しました:', error);
      }
    };

    fetchUsers();
  }, [convertUserData]);

  // 初期データの読み込み
  useEffect(() => {
    const loadGroups = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();

        // グループマスターテーブルからデータ取得
        const { data: groupData, error: groupError } = await supabase
          .from('mst_group')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: true });

        if (groupError) throw groupError;

        // 各グループに対してユーザー情報を取得
        const groupsWithUsers = await Promise.all(
          groupData.map(async (group) => {
            const { data, error: usersError } = await supabase
              .from('trn_group_user')
              .select(`
                user_id,
                mst_user!inner (
                  user_id,
                  username,
                  email,
                  phone_number,
                  company_name,
                  created_at,
                  updated_at
                )
              `)
              .eq('group_id', group.group_id)
              .is('deleted_at', null);

            if (usersError) throw usersError;

            // 型アサーションを使用
            const usersData = data as unknown as SupabaseGroupUser[];

            // User型に合わせたデータ構造に変換
            const users: User[] = usersData.map((userData) => ({
              // MstUserの必須フィールド
              user_id: userData.mst_user.user_id,
              email: userData.mst_user.email,

              // MstUserのオプショナルフィールド（nullableなフィールド）
              bio: null,
              birth_date: null,
              company_address: null,
              company_name: userData.mst_user.company_name || null,
              company_name_kana: null,
              created_at: userData.mst_user.created_at,
              daihyosha_id: null,
              deleted_at: null,
              icon: null,
              industry_id: null,
              invite_link: null,
              is_birth_date_visible: null,
              is_company_address_visible: null,
              is_company_name_kana_visible: null,
              is_email_visible: null,
              is_phone_number_visible: null,
              is_user_name_kana_visible: null,
              is_user_type_visible: null,
              is_user_position_visible: null,
              is_bio_visible: null,
              is_company_name_visible: null,
              is_industry_id_visible: null,
              is_nickname_visible: null,
              is_profile_public: null,
              is_sns_visible: null,
              is_username_visible: null,
              is_website_url_visible: null,
              last_login_at: userData.mst_user.updated_at,
              last_payment_date: null,
              nickname: null,
              phone_number: userData.mst_user.phone_number || null,
              social_media_links: null,
              updated_at: userData.mst_user.updated_at,
              user_name_kana: null,
              user_position: null,
              user_type: null,
              username: userData.mst_user.username || null,
              website_url: null,
              building_name: null,
              city_address: null,
              my_asp_user_id: null,
              postal_code: null,
              prefecture: null,

              // フロントエンド用の追加フィールド（下位互換性のため）
              id: userData.mst_user.user_id,
              displayName: userData.mst_user.username || '',
              memberNumber: '',
              role: 'パートナー',
              groups: [],
              joinedDate: convertToJST(userData.mst_user.created_at),
              lastAccess: convertToJST(userData.mst_user.updated_at),
              updatedAt: convertToJST(userData.mst_user.updated_at),
              companyName: userData.mst_user.company_name || '',
              company: userData.mst_user.company_name || '',
              profileImage: '',
              userName: userData.mst_user.username || '',
              phoneNumber: userData.mst_user.phone_number || '',
              createdAt: convertToJST(userData.mst_user.created_at),
              companyNameKana: '',
            }));

            // Group型に合わせたデータ構造
            return {
              group_id: group.group_id,
              title: group.title,
              description: group.description,
              created_at: group.created_at,
              updated_at: group.updated_at,
              deleted_at: group.deleted_at,
              users: users,
            };
          }),
        );

        setGroups(groupsWithUsers);
      } catch (error) {
        console.error('グループデータの取得に失敗しました:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGroups();
  }, [convertToJST]);

  // 個別選択の処理
  const handleSelectGroup = (groupId: string) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter((id) => id !== groupId));
    } else {
      setSelectedGroups([...selectedGroups, groupId]);
    }
  };

  // 編集ページへのリダイレクト
  const handleEdit = (groupId: string) => {
    router.push(`/group/edit/${groupId}`);
  };

  // 削除ボタンのハンドラー
  const handleDelete = (groupId: string) => {
    setGroupToDelete(groupId);
    setIsDeleteModalOpen(true);
  };

  // 削除確認時の処理
  const confirmDelete = async () => {
    if (groupToDelete) {
      try {
        const supabase = createClient();

        // 論理削除（deleted_atを設定）
        const { error } = await supabase
          .from('mst_group')
          .update({ deleted_at: new Date().toISOString() })
          .eq('group_id', groupToDelete);

        if (error) throw error;

        // 成功したら画面のステートを更新
        setGroups(groups.filter((group) => group.group_id !== groupToDelete));
      } catch (error) {
        console.error('グループの削除に失敗しました:', error);
      } finally {
        setIsDeleteModalOpen(false);
        setGroupToDelete(null);
      }
    }
  };

  // 削除キャンセル時の処理
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setGroupToDelete(null);
  };

  const handleCreateGroup = () => {
    router.push('/group/create');
  };

  // グループにユーザーを追加するモーダルを表示
  const handleShowAddModal = (groupId: string) => {
    setSelectedGroupForUsers(groupId);
    setShowAddModal(true);
  };

  // グループにユーザーを追加
  const addUsersToGroup = async (selectedUserIds: string[]) => {
    try {
      const supabase = createClient();

      // 選択されたグループIDを取得
      const targetGroupId = selectedGroupForUsers;

      if (!targetGroupId) {
        console.error('グループが選択されていません');
        return;
      }

      // 現在のグループユーザーを取得（アクティブなユーザーのみ）
      const { data: activeUsers, error: activeUsersError } = await supabase
        .from('trn_group_user')
        .select('user_id')
        .eq('group_id', targetGroupId)
        .is('deleted_at', null);

      if (activeUsersError) throw activeUsersError;

      // 削除済みユーザーを取得（論理削除されているユーザー）
      const { data: deletedUsers, error: deletedUsersError } = await supabase
        .from('trn_group_user')
        .select('user_id')
        .eq('group_id', targetGroupId)
        .not('deleted_at', 'is', null);

      if (deletedUsersError) throw deletedUsersError;

      const activeUserIds = activeUsers.map((u) => u.user_id);
      const deletedUserIds = deletedUsers.map((u) => u.user_id);

      // 1. 追加するユーザー（選択されているが現在アクティブでない）
      const userIdsToAdd = selectedUserIds.filter(
        (id) => !activeUserIds.includes(id),
      );

      // 2. 削除するユーザー（現在アクティブだが選択されていない）
      const userIdsToRemove = activeUserIds.filter(
        (id) => !selectedUserIds.includes(id),
      );

      // 3. 復活させるユーザー（削除済みだが再度選択された）
      const userIdsToReactivate = userIdsToAdd.filter((id) =>
        deletedUserIds.includes(id),
      );

      // 4. 新規追加するユーザー（削除済みにも存在しない）
      const userIdsToInsert = userIdsToAdd.filter(
        (id) => !deletedUserIds.includes(id),
      );

      // 処理1: 削除済みユーザーの復活処理
      if (userIdsToReactivate.length > 0) {
        const { error: reactivateError } = await supabase
          .from('trn_group_user')
          .update({
            deleted_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('group_id', targetGroupId)
          .in('user_id', userIdsToReactivate);

        if (reactivateError) throw reactivateError;
      }

      // 処理2: 新規ユーザーの追加処理
      if (userIdsToInsert.length > 0) {
        const entries = userIdsToInsert.map((userId) => ({
          group_id: targetGroupId,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { error: addError } = await supabase
          .from('trn_group_user')
          .insert(entries);
        if (addError) throw addError;
      }

      // 処理3: ユーザーの削除処理（論理削除）
      if (userIdsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('trn_group_user')
          .update({
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('group_id', targetGroupId)
          .in('user_id', userIdsToRemove);

        if (removeError) throw removeError;
      }

      // 何も変更がない場合は早期リターン
      if (
        userIdsToInsert.length === 0 &&
        userIdsToReactivate.length === 0 &&
        userIdsToRemove.length === 0
      ) {
        setShowAddModal(false);
        return;
      }

      // 更新後のグループデータを取得して画面を更新
      const { data: updatedUserData, error: updatedUserError } = await supabase
        .from('trn_group_user')
        .select(`
          user_id,
          mst_user!inner (
            user_id,
            username,
            email,
            phone_number,
            company_name,
            created_at,
            updated_at
          )
        `)
        .eq('group_id', targetGroupId)
        .is('deleted_at', null);

      if (updatedUserError) throw updatedUserError;

      // 型アサーションを使用
      const updatedUsers = updatedUserData as unknown as SupabaseGroupUser[];

      // User型に変換
      const formattedUsers: User[] = updatedUsers.map((userData) => ({
        // MstUserの必須フィールド
        user_id: userData.mst_user.user_id,
        email: userData.mst_user.email,

        // MstUserのオプショナルフィールド（nullableなフィールド）
        bio: null,
        birth_date: null,
        company_address: null,
        company_name: userData.mst_user.company_name || null,
        company_name_kana: null,
        created_at: userData.mst_user.created_at,
        daihyosha_id: null,
        deleted_at: null,
        icon: null,
        industry_id: null,
        invite_link: null,
        is_birth_date_visible: null,
        is_company_address_visible: null,
        is_company_name_kana_visible: null,
        is_email_visible: null,
        is_phone_number_visible: null,
        is_user_name_kana_visible: null,
        is_user_type_visible: null,
        is_user_position_visible: null,
        is_bio_visible: null,
        is_company_name_visible: null,
        is_industry_id_visible: null,
        is_nickname_visible: null,
        is_profile_public: null,
        is_sns_visible: null,
        is_username_visible: null,
        is_website_url_visible: null,
        last_login_at: userData.mst_user.updated_at,
        last_payment_date: null,
        nickname: null,
        phone_number: userData.mst_user.phone_number || null,
        social_media_links: null,
        updated_at: userData.mst_user.updated_at,
        user_name_kana: null,
        user_position: null,
        user_type: null,
        username: userData.mst_user.username || null,
        website_url: null,
        building_name: null,
        city_address: null,
        my_asp_user_id: null,
        postal_code: null,
        prefecture: null,

        // フロントエンド用の追加フィールド（下位互換性のため）
        id: userData.mst_user.user_id,
        displayName: userData.mst_user.username || '',
        memberNumber: '',
        role: 'パートナー' as const,
        groups: [],
        joinedDate: convertToJST(userData.mst_user.created_at),
        lastAccess: convertToJST(userData.mst_user.updated_at),
        updatedAt: convertToJST(userData.mst_user.updated_at),
        companyName: userData.mst_user.company_name || '',
        company: userData.mst_user.company_name || '',
        profileImage: '',
        userName: userData.mst_user.username || '',
        phoneNumber: userData.mst_user.phone_number || '',
        createdAt: convertToJST(userData.mst_user.created_at),
        companyNameKana: '',
      }));

      // グループリストを更新
      const updatedGroups = [...groups];
      const targetGroupIndex = updatedGroups.findIndex(
        (g) => g.group_id === targetGroupId,
      );

      if (targetGroupIndex >= 0) {
        updatedGroups[targetGroupIndex] = {
          ...updatedGroups[targetGroupIndex],
          users: formattedUsers,
        };

        setGroups(updatedGroups);
      }

      setShowAddModal(false);
    } catch (error) {
      console.error('ユーザーの追加・削除に失敗しました:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={css({ p: '8', textAlign: 'center' })}>読み込み中...</div>
    );
  }

  return (
    <div
      className={css({
        p: { base: '2', xl: '8' },
        pt: { base: '4', xl: '20' },
        minH: 'calc(100vh - 64px)',
      })}
    >
      <div
        className={css({
          bg: 'white',
          rounded: 'lg',
          shadow: 'sm',
          overflow: 'hidden',
          p: '4',
        })}
      >
        {/* ヘッダー部分 */}
        <GroupListHeader handleCreateGroup={handleCreateGroup} />

        {/* テーブル部分 - デスクトップ表示 */}
        <GroupTable
          currentGroups={groups}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleAddUsers={handleShowAddModal}
          undeletableGroupNames={UNDELETABLE_GROUP_NAMES}
        />

        {/* カード表示 - モバイル表示 */}
        <GroupCard
          currentGroups={groups}
          selectedGroups={selectedGroups}
          handleSelectGroup={handleSelectGroup}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleAddUsers={handleShowAddModal}
          undeletableGroupNames={UNDELETABLE_GROUP_NAMES}
        />
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          itemName="グループ"
          targetName={groups.find((g) => g.group_id === groupToDelete)?.title}
        />

        <AddUserToGroupModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          users={allUsers}
          onSubmit={(selectedIds) => {
            addUsersToGroup(selectedIds);
          }}
          currentGroupId={selectedGroupForUsers}
          currentGroups={groups}
        />
      </div>
    </div>
  );
};

// メインコンポーネント - Suspenseで囲む
const GroupListPage = () => {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <GroupListContent />
    </Suspense>
  );
};

export default GroupListPage;
