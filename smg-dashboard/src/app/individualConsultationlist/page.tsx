import { IndividualConsultationListClient } from '@/components/individualConsultationlist/IndividualConsultationListClient';
import { getIndividualConsultationsAction } from '@/lib/api/individualConsultation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '個別相談一覧',
};

type PageProps = {
  searchParams: {
    page?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  };
};

export default async function IndividualConsultationListPage({
  searchParams,
}: PageProps) {
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1;
  const search = searchParams.search || '';
  const sortBy =
    searchParams.sortBy === 'applicationDate' || searchParams.sortBy === 'title'
      ? searchParams.sortBy
      : 'createdDate';
  const sortOrder =
    searchParams.sortOrder === 'asc' ? 'asc' : ('desc' as 'asc' | 'desc');

  // サーバーサイドでデータ取得
  const { consultations, totalCount } = await getIndividualConsultationsAction({
    page,
    itemsPerPage: 5,
    searchQuery: search,
    sortBy,
    sortOrder,
  });

  return (
    <IndividualConsultationListClient
      initialConsultations={consultations}
      initialTotalCount={totalCount}
      initialPage={page}
      initialSearchQuery={search}
      initialSortBy={sortBy}
      initialSortOrder={sortOrder}
    />
  );
}
