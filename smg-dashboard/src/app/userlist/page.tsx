import { UserListClient } from '@/components/userlist/UserListClient';
import { getUsersAction } from '@/lib/api/user';
import { css } from '@/styled-system/css';

type PageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    filterRole?: string;
    sortByJoined?: 'asc' | 'desc';
  }>;
};

export default async function UserListPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page) : 1;
  const searchQuery = params.search || '';
  const filterRole = params.filterRole || 'all';
  const sortByJoinedDate = params.sortByJoined || null;

  const { users, totalCount, userTypes, canViewPaymentStatus } =
    await getUsersAction({
      page,
      itemsPerPage: 50,
      searchQuery,
      filterRole,
      sortByJoinedDate,
    });

  return (
    <div
      className={css({
        p: { base: '2', md: '8' },
        pt: { base: '4', md: '20' },
        minH: 'calc(100vh - 64px)',
      })}
    >
      <div
        className={css({
          bg: 'white',
          rounded: 'lg',
          shadow: 'sm',
          overflow: 'hidden',
        })}
      >
        <UserListClient
          initialUsers={users}
          initialTotalCount={totalCount}
          initialUserTypes={userTypes}
          initialCanViewPaymentStatus={canViewPaymentStatus}
          initialPage={page}
          initialSearchQuery={searchQuery}
          initialFilterRole={filterRole}
          initialSortByJoinedDate={sortByJoinedDate}
        />
      </div>
    </div>
  );
}
