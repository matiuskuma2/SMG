'use client';

import { FaqForm } from '@/components/faq/FaqForm';
import { getFaqById, updateFaq } from '@/lib/api/faq';
import type { FaqInput } from '@/types/faq';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function FaqEditPage() {
  const params = useParams();
  const router = useRouter();
  const faqId = params.faqid as string;

  const [initialData, setInitialData] = useState<FaqInput | null>(null);
  const [loading, setLoading] = useState(true);

  // FAQデータの取得
  useEffect(() => {
    const fetchFaq = async () => {
      try {
        const data = await getFaqById(faqId);

        if (!data) {
          alert('FAQが見つかりませんでした');
          router.push('/faqlist');
          return;
        }

        setInitialData({
          title: data.title,
          description: data.description || '',
          display_order: data.display_order,
        });
      } catch (error) {
        console.error('Error fetching FAQ:', error);
        alert('FAQの取得に失敗しました');
        router.push('/faqlist');
      } finally {
        setLoading(false);
      }
    };

    fetchFaq();
  }, [faqId, router]);

  // 更新処理
  const handleSubmit = async (data: FaqInput) => {
    try {
      await updateFaq(faqId, data);
      alert('FAQを更新しました');
      router.push('/faqlist');
    } catch (error) {
      console.error('Error updating FAQ:', error);
      alert('FAQの更新に失敗しました');
    }
  };

  // キャンセル処理
  const handleCancel = () => {
    router.push('/faqlist');
  };

  if (loading || !initialData) {
    return null;
  }

  return (
    <FaqForm
      isEditing={true}
      initialData={initialData}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
