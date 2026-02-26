'use client';

import { EnqueteForm } from '@/components/enquete/EnqueteForm';
import type { EnqueteFormData } from '@/components/enquete/types';

export default function CreateEnquetePage() {
  const handleSubmit = (data: EnqueteFormData) => {
    console.log('Form submitted:', data);
    // ここにフォーム送信のロジックを実装
  };

  return <EnqueteForm onSubmit={handleSubmit} />;
}
