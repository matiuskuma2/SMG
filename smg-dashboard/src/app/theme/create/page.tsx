'use client';

import type { ThemeFormData } from '@/components/theme/ThemeForm';
import { ThemeForm } from '@/components/theme/ThemeForm';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ThemeCreatePage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: ThemeFormData) => {
    try {
      setError(null);

      const insertData = {
        theme_name: data.theme_name,
        description: data.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('mst_theme').insert(insertData);

      if (error) {
        console.error('Error creating theme:', error);
        setError('テーマの作成に失敗しました');
        return;
      }

      router.push('/theme');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('予期しないエラーが発生しました');
    }
  };

  const handleCancel = () => {
    router.push('/theme');
  };

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
      <ThemeForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </>
  );
}
