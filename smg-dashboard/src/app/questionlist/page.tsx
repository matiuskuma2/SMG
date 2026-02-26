import { QuestionListClient } from '@/components/questionlist/QuestionListClient';
import type {
  FilterType,
  SortKey,
} from '@/components/questionlist/QuestionTypes';
import { getQuestionsAction } from '@/lib/api/questionsAction';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '質問一覧',
};

type PageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    filterType?: string;
    instructor?: string;
    answeredOnly?: string;
    visibleOnly?: string;
  }>;
};

export default async function QuestionListPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // URLパラメータを解析
  const page = params.page ? Number.parseInt(params.page) : 1;
  const search = params.search || '';
  const sortBy = (
    ['questionDate', 'answerDate'].includes(params.sortBy || '')
      ? params.sortBy
      : 'questionDate'
  ) as SortKey;
  const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc';
  const filterType = (
    params.filterType === 'anonymous' ? 'anonymous' : 'public'
  ) as FilterType;
  const instructorId = params.instructor || '';
  const isAnsweredOnly = params.answeredOnly === 'true';
  const isVisibleOnly = params.visibleOnly === 'true';

  // サーバーサイドでデータ取得
  const { questions, totalCount, instructors } = await getQuestionsAction({
    page,
    itemsPerPage: 5,
    searchQuery: search,
    sortBy,
    sortOrder,
    filterType,
    instructorId,
    isAnsweredOnly,
    isVisibleOnly,
  });

  return (
    <QuestionListClient
      initialQuestions={questions}
      initialTotalCount={totalCount}
      initialInstructors={instructors}
      initialPage={page}
      initialSearchQuery={search}
      initialSortBy={sortBy}
      initialSortOrder={sortOrder}
      initialFilterType={filterType}
      initialInstructorId={instructorId}
      initialIsAnsweredOnly={isAnsweredOnly}
      initialIsVisibleOnly={isVisibleOnly}
    />
  );
}
