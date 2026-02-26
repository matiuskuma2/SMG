import { QuestionManualClient } from '@/components/questionManual/QuestionManualClient';
import { getQuestionManual } from '@/lib/api/questionManual';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '質問の使い方',
};

export default async function QuestionHowtoPage() {
  const manual = await getQuestionManual();

  return (
    <QuestionManualClient
      initialData={{
        question_manual_id: manual?.question_manual_id || null,
        description: manual?.description || '',
      }}
    />
  );
}
