import { ArchiveListClient } from '@/components/archivelist/ArchiveListClient';
import { getArchivesAction } from '@/lib/api/archive';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'アーカイブ一覧',
};

type PageProps = {
  searchParams: {
    page?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    filter?: string;
  };
};

export default async function ArchiveListPage({ searchParams }: PageProps) {
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1;
  const search = searchParams.search || '';
  const sortBy =
    searchParams.sortBy === 'publishDate' || searchParams.sortBy === 'title'
      ? searchParams.sortBy
      : 'createdDate';
  const sortOrder =
    searchParams.sortOrder === 'asc' ? 'asc' : ('desc' as 'asc' | 'desc');
  const combinedFilter = searchParams.filter || 'all';

  // サーバーサイドでデータ取得
  const { archives, totalCount, eventTypes, archiveTypes } =
    await getArchivesAction({
      page,
      itemsPerPage: 10,
      searchQuery: search,
      sortBy,
      sortOrder,
      combinedFilter,
    });

  return (
    <ArchiveListClient
      initialArchives={archives}
      initialTotalCount={totalCount}
      initialPage={page}
      initialSearchQuery={search}
      initialSortBy={sortBy}
      initialSortOrder={sortOrder}
      initialCombinedFilter={combinedFilter}
      eventTypes={eventTypes}
      archiveTypes={archiveTypes}
    />
  );
}
