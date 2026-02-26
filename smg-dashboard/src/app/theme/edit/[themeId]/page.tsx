'use client';

import type { ThemeFormData } from '@/components/theme/ThemeForm';
import { ThemeForm } from '@/components/theme/ThemeForm';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function ThemeEditContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const themeId = params.themeId as string;

  const [initialData, setInitialData] = useState<ThemeFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const { data, error } = await supabase
          .from('mst_theme')
          .select('*')
          .eq('theme_id', themeId)
          .is('deleted_at', null)
          .single();

        if (error) throw error;

        if (data) {
          setInitialData({
            theme_name: data.theme_name,
            description: data.description || '',
          });
        }
      } catch (err) {
        console.error('Error fetching theme:', err);
        setError('テーマの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTheme();
  }, [themeId, supabase]);

  const handleSubmit = async (data: ThemeFormData) => {
    try {
      setError(null);

      const updateData = {
        theme_name: data.theme_name,
        description: data.description || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('mst_theme')
        .update(updateData)
        .eq('theme_id', themeId);

      if (error) {
        console.error('Error updating theme:', error);
        setError('テーマの更新に失敗しました');
        return;
      }

      // returnQueryパラメータがあればそのURLに戻る
      const returnQuery = searchParams.get('returnQuery');
      if (returnQuery) {
        router.push(`/theme?${returnQuery}`);
      } else {
        router.push('/theme');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('予期しないエラーが発生しました');
    }
  };

  const handleDelete = async () => {
    try {
      setError(null);

      const { error } = await supabase
        .from('mst_theme')
        .update({ deleted_at: new Date().toISOString() })
        .eq('theme_id', themeId);

      if (error) {
        console.error('Error deleting theme:', error);
        setError('テーマの削除に失敗しました');
        return;
      }

      const returnQuery = searchParams.get('returnQuery');
      if (returnQuery) {
        router.push(`/theme?${returnQuery}`);
      } else {
        router.push('/theme');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('予期しないエラーが発生しました');
    }
  };

  const handleCancel = () => {
    const returnQuery = searchParams.get('returnQuery');
    if (returnQuery) {
      router.push(`/theme?${returnQuery}`);
    } else {
      router.push('/theme');
    }
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (!initialData) {
    return <div>テーマが見つかりませんでした</div>;
  }

  return (
    <>
      {error && (
        <div
          style={{
            padding: '1rem',
            margin: '1rem',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c00',
          }}
        >
          {error}
        </div>
      )}
      <ThemeForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onDelete={handleDelete}
        initialData={initialData}
        isEditing={true}
      />
    </>
  );
}

export default function ThemeEditPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <ThemeEditContent />
    </Suspense>
  );
}
