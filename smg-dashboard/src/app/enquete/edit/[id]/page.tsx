'use client';

import { EnqueteForm } from '@/components/enquete/EnqueteForm';
import { mockEnqueteData } from '@/components/enquete/mockData';
import type { EnqueteFormData } from '@/components/enquete/types';
import { useParams } from 'next/navigation';

export default function EditEnquetePage() {
  const params = useParams();
  const enqueteId = params.id as string;

  // 実際の実装ではIDに基づいてデータを取得するロジックを追加
  // 現在はモックデータを使用
  const handleSubmit = (data: EnqueteFormData) => {
    console.log(`Enquete ID: ${enqueteId} updated with:`, data);
    // ここでデータ更新のロジックを実装
  };

  return (
    <EnqueteForm
      initialData={mockEnqueteData}
      onSubmit={handleSubmit}
      submitButtonText="更新"
    />
  );
}
