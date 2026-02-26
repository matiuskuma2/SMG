'use client';

import { ForBeginnersListCards } from '@/components/forBeginnerslist/forBeginnersListCards';
import { ForBeginnersListFooter } from '@/components/forBeginnerslist/forBeginnersListFooter';
import { ForBeginnersListHeader } from '@/components/forBeginnerslist/forBeginnersListHeader';
import { ForBeginnersListSearch } from '@/components/forBeginnerslist/forBeginnersListSearch';
import { ForBeginnersListTable } from '@/components/forBeginnerslist/forBeginnersListTable';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { deleteBeginnerGuideItem } from '@/lib/api/beginnerGuides';
import type { ForBeginners } from '@/lib/api/forBeginners';
import { css } from '@/styled-system/css';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

type ForBeginnersListClientProps = {
  initialItems: ForBeginners[];
  initialTotalCount: number;
  initialPage: number;
  initialSearchQuery: string;
  initialSortBy: 'date' | 'title';
  initialSortOrder: 'asc' | 'desc';
};

const ForBeginnersListClient = ({
  initialItems,
  initialTotalCount,
  initialPage,
  initialSearchQuery,
  initialSortBy,
  initialSortOrder,
}: ForBeginnersListClientProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [items, setItems] = useState(initialItems);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Sync state with props
  useEffect(() => {
    setItems(initialItems);
    setTotalCount(initialTotalCount);
    setCurrentPage(initialPage);
    setSearchQuery(initialSearchQuery);
    setSortBy(initialSortBy);
    setSortOrder(initialSortOrder);
  }, [
    initialItems,
    initialTotalCount,
    initialPage,
    initialSearchQuery,
    initialSortBy,
    initialSortOrder,
  ]);

  const handleSearch = (query: string) => {
    startTransition(() => {
      const params = new URLSearchParams();
      params.set('page', '1');
      if (query) params.set('search', query);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      router.push(`/forBeginnerslist?${params.toString()}`);
    });
  };

  const handlePageChange = (page: number) => {
    startTransition(() => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (searchQuery) params.set('search', searchQuery);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      router.push(`/forBeginnerslist?${params.toString()}`);
    });
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    startTransition(() => {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      if (searchQuery) params.set('search', searchQuery);
      params.set('sortBy', sortBy);
      params.set('sortOrder', newOrder);
      router.push(`/forBeginnerslist?${params.toString()}`);
    });
  };

  const handleSortByChange = (newSortBy: 'date' | 'title') => {
    startTransition(() => {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      if (searchQuery) params.set('search', searchQuery);
      params.set('sortBy', newSortBy);
      params.set('sortOrder', sortOrder);
      router.push(`/forBeginnerslist?${params.toString()}`);
    });
  };

  const handleCreateForBeginners = () => {
    router.push('/forBeginners/create');
  };

  const handleEdit = (guideItemId: string) => {
    router.push(`/forBeginners/edit/${guideItemId}`);
  };

  const handleDelete = (guideItemId: string) => {
    setItemToDelete(guideItemId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteBeginnerGuideItem(itemToDelete);
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        // Refresh the page to get updated data
        router.refresh();
      } catch (error) {
        console.error('Failed to delete beginner guide item:', error);
      }
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  return (
    <>
      {isPending && (
        <div
          className={css({
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          })}
        >
          <div
            className={css({
              backgroundColor: 'white',
              padding: '6',
              borderRadius: 'md',
              boxShadow: 'lg',
            })}
          >
            読み込み中...
          </div>
        </div>
      )}

      <div
        className={css({
          p: { base: '2', xl: '8' },
          pt: { base: '4', xl: '20' },
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
          <ForBeginnersListHeader
            handleCreateForBeginners={handleCreateForBeginners}
          />

          <ForBeginnersListSearch
            searchQuery={searchQuery}
            handleSearch={handleSearch}
            sortBy={sortBy}
            sortOrder={sortOrder}
            setSortBy={handleSortByChange}
            toggleSortOrder={toggleSortOrder}
          />

          {items.length === 0 ? (
            <div className={css({ p: '8', textAlign: 'center' })}>
              データがありません
            </div>
          ) : (
            <>
              <ForBeginnersListTable
                notices={items}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
              />

              <ForBeginnersListCards
                notices={items}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
              />

              <ForBeginnersListFooter
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          itemName="初めての方へ"
          targetName={
            items.find((item) => item.guide_item_id === itemToDelete)?.title
          }
        />
      </div>
    </>
  );
};

export default ForBeginnersListClient;
