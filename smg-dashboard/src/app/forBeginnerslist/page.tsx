import ForBeginnersListClient from '@/components/forBeginnerslist/ForBeginnersListClient';
import { getForBeginnersAction } from '@/lib/api/forBeginners';

type SearchParams = {
  page?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
};

type ForBeginnersListPageProps = {
  searchParams: SearchParams;
};

const ForBeginnersListPage = async ({
  searchParams,
}: ForBeginnersListPageProps) => {
  const page = Number(searchParams.page) || 1;
  const searchQuery = searchParams.search || '';
  const sortBy = (searchParams.sortBy as 'date' | 'title') || 'date';
  const sortOrder = (searchParams.sortOrder as 'asc' | 'desc') || 'asc';

  const { items, totalCount } = await getForBeginnersAction({
    page,
    itemsPerPage: 10,
    searchQuery,
    sortBy,
    sortOrder,
  });

  return (
    <ForBeginnersListClient
      initialItems={items}
      initialTotalCount={totalCount}
      initialPage={page}
      initialSearchQuery={searchQuery}
      initialSortBy={sortBy}
      initialSortOrder={sortOrder}
    />
  );
};

export default ForBeginnersListPage;
