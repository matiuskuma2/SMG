'use client';

import { UserForm } from '@/components/user/userForm';
import type { UserFormData } from '@/components/userlist/types';
import { revalidateUser } from '@/lib/api/revalidate';
import { getReturnQuery } from '@/utils/navigation';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function UserEditPage({
  params,
}: {
  params: { userId: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = params.userId;
  const [userData, setUserData] = useState<Partial<UserFormData>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // リストページに戻る際のURL（クエリパラメータを保持）
  const getReturnUrl = () => {
    const returnQuery = getReturnQuery(searchParams);
    return returnQuery ? `/userlist?${returnQuery}` : '/userlist';
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('Fetching user data for ID:', userId);
        const response = await fetch(`/api/users/${userId}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        const result = await response.json();
        console.log('Raw API response:', result);

        if (!response.ok) {
          throw new Error(result.error || 'ユーザーの取得に失敗しました');
        }

        const user = result.user;
        console.log('Received user data:', user);

        const formData = {
          id: user.user_id,
          userName: user.username,
          userNameKana: user.user_name_kana,
          email: user.email,
          companyName: user.company_name,
          companyNameKana: user.company_name_kana,
          userType: user.user_type,
          daihyoshaId: user.daihyosha_id,
          birthDate: user.birth_date,
        };
        console.log('Formatted form data:', formData);

        setUserData(formData);
      } catch (error) {
        console.error('ユーザー取得エラー:', error);
        setError(
          error instanceof Error
            ? error.message
            : 'ユーザーの取得に失敗しました',
        );
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleSubmit = async (data: UserFormData) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ユーザーの更新に失敗しました');
      }

      // キャッシュを再検証
      await revalidateUser();

      router.push(getReturnUrl());
    } catch (error) {
      console.error('ユーザー更新エラー:', error);
      setError(
        error instanceof Error ? error.message : 'ユーザーの更新に失敗しました',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(getReturnUrl());
  };

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  if (isLoadingData) {
    return <div className="p-6 text-center">読み込み中...</div>;
  }

  return (
    <div>
      <UserForm
        isEditing={true}
        initialData={userData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}
