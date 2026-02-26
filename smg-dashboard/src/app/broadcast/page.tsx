'use client';

import { BroadcastForm } from '@/components/broadcast/BroadcastForm';
import {
  createBroadcast,
  getGroups,
  getUsersByGroupIds,
} from '@/lib/api/broadcast';
import { css } from '@/styled-system/css';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Group = {
  group_id: string;
  title: string;
  description: string;
};

type User = {
  user_id: string;
  username: string;
  email: string;
  company_name: string | null;
};

export default function BroadcastPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 初期データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsData, usersData] = await Promise.all([
          getGroups(),
          getUsersByGroupIds([]),
        ]);
        setGroups(groupsData);
        setUsers(usersData as User[]);
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // グループ選択変更時にユーザーを再取得
  const handleGroupSelectionChange = async (groupIds: string[]) => {
    try {
      const usersData = await getUsersByGroupIds(groupIds);
      setUsers(usersData as User[]);
    } catch (error) {
      console.error('ユーザー取得エラー:', error);
    }
  };

  // 送信処理
  const handleSubmit = async (content: string, selectedUserIds: string[]) => {
    try {
      await createBroadcast({
        content,
        user_ids: selectedUserIds,
      });
      router.push('/broadcast-history');
    } catch (error) {
      console.error('送信エラー:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div
        className={css({
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minH: 'calc(100vh - 64px)',
        })}
      >
        読み込み中...
      </div>
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
          maxW: '1200px',
          mx: 'auto',
        })}
      >
        {/* ヘッダー部分 */}
        <div
          className={css({
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'gray.200',
            p: { base: '3', xl: '4' },
            position: 'relative',
          })}
        >
          <h1
            className={css({
              fontSize: { base: 'lg', xl: 'xl' },
              fontWeight: 'bold',
            })}
          >
            一斉配信
          </h1>
        </div>

        {/* フォーム部分 */}
        <BroadcastForm
          groups={groups}
          users={users}
          onSubmit={handleSubmit}
          onGroupSelectionChange={handleGroupSelectionChange}
        />
      </div>
    </div>
  );
}
