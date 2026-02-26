import { RadioListClient } from '@/components/radiolist/RadioListClient';
import { getRadiosAction } from '@/lib/api/radio';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ラジオ一覧',
};

type PageProps = {
  searchParams: {
    page?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  };
};

export default async function RadioListPage({ searchParams }: PageProps) {
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1;
  const search = searchParams.search || '';
  const sortBy =
    searchParams.sortBy === 'radio_name' ? 'radio_name' : 'created_at';
  const sortOrder =
    searchParams.sortOrder === 'asc' ? 'asc' : ('desc' as 'asc' | 'desc');

  // サーバーサイドでデータ取得
  const { radios, totalCount } = await getRadiosAction({
    page,
    itemsPerPage: 10,
    searchQuery: search,
    sortBy,
    sortOrder,
  });

  return (
    <RadioListClient
      initialRadios={radios}
      initialTotalCount={totalCount}
      initialPage={page}
      initialSearchQuery={search}
      initialSortBy={sortBy}
      initialSortOrder={sortOrder}
    />
  );
}
