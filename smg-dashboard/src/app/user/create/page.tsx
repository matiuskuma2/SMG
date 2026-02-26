'use client';

import { UserForm } from '@/components/user/userForm';
import type { UserFormData } from '@/components/userlist/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function UserCreatePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: UserFormData) => {
    try {
      setError(null);
      setIsLoading(true);

      if (!data.password) {
        setError('パスワードは必須です');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ユーザーの作成に失敗しました');
      }

      router.push('/userlist');
    } catch (error) {
      console.error('ユーザー作成エラー:', error);
      setError(
        error instanceof Error ? error.message : 'ユーザーの作成に失敗しました',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div>
      <UserForm
        isEditing={false}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}
