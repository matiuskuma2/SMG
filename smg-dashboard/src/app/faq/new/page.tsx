'use client';

import { FaqForm } from '@/components/faq/FaqForm';
import { createFaq } from '@/lib/api/faq';
import type { FaqInput } from '@/types/faq';
import { useRouter } from 'next/navigation';

export default function FaqNewPage() {
  const router = useRouter();

  // 作成処理
  const handleSubmit = async (data: FaqInput) => {
    try {
      await createFaq(data);
      alert('FAQを作成しました');
      router.push('/faqlist');
    } catch (error) {
      console.error('Error creating FAQ:', error);
      alert('FAQの作成に失敗しました');
    }
  };

  // キャンセル処理
  const handleCancel = () => {
    router.push('/faqlist');
  };

  return (
    <FaqForm
      isEditing={false}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
