'use client';

import { ArchiveListCards } from '@/components/archivelist/ArchiveListCards';
import { ArchiveListFooter } from '@/components/archivelist/ArchiveListFooter';
import { ArchiveListHeader } from '@/components/archivelist/ArchiveListHeader';
import { ArchiveListSearch } from '@/components/archivelist/ArchiveListSearch';
import { ArchiveListTable } from '@/components/archivelist/ArchiveListTable';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import type { Archive } from '@/lib/api/archive';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import { getQueryParamsString } from '@/utils/navigation';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

type ArchiveListClientProps = {
  initialArchives: Archive[];
  initialTotalCount: number;
  initialPage: number;
  initialSearchQuery: string;
  initialSortBy: 'createdDate' | 'publishDate' | 'title';
  initialSortOrder: 'asc' | 'desc';
  initialCombinedFilter: string;
  eventTypes: { [key: string]: string };
  archiveTypes: { [key: string]: string };
};

export const ArchiveListClient = ({
  initialArchives,
  initialTotalCount,
  initialPage,
  initialSearchQuery,
  initialSortBy,
  initialSortOrder,
  initialCombinedFilter,
  eventTypes,
  archiveTypes,
}: ArchiveListClientProps) => {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [archives, setArchives] = useState<Archive[]>(initialArchives);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [sortBy, setSortBy] = useState<'createdDate' | 'publishDate' | 'title'>(
    initialSortBy,
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);
  const [combinedFilter, setCombinedFilter] = useState(initialCombinedFilter);
  const [itemsPerPage] = useState(10);

  // モーダル用の状態
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [archiveToDelete, setArchiveToDelete] = useState<string | null>(null);

  // Server Componentから新しいデータを受け取ったら更新
  useEffect(() => {
    setArchives(initialArchives);
    setTotalCount(initialTotalCount);
    setCurrentPage(initialPage);
    setSearchQuery(initialSearchQuery);
    setSortBy(initialSortBy);
    setSortOrder(initialSortOrder);
    setCombinedFilter(initialCombinedFilter);
  }, [
    initialArchives,
    initialTotalCount,
    initialPage,
    initialSearchQuery,
    initialSortBy,
    initialSortOrder,
    initialCombinedFilter,
  ]);

  // 編集ページへのリダイレクト
  const handleEdit = (archiveId: string) => {
    const archive = archives.find((a) => a.archive_id === archiveId);
    const queryString = getQueryParamsString(searchParams);
    const returnQuery = queryString
      ? `&returnQuery=${encodeURIComponent(queryString)}`
      : '';

    if (archive?.event_id) {
      router.push(
        `/event/archive/${archive.event_id}?archiveId=${archiveId}${returnQuery}`,
      );
    } else {
      const editUrl = `/archive/edit/${archiveId}${returnQuery ? `?returnQuery=${encodeURIComponent(queryString)}` : ''}`;
      router.push(editUrl);
    }
  };

  // 検索処理
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    updateQueryParams(1, { search: query });
  };

  // ソート順を切り替える
  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    setCurrentPage(1);
    updateQueryParams(1, { sortOrder: newOrder });
  };

  // ソート基準変更
  const handleSortByChange = (value: string) => {
    const newSortBy =
      value === 'publishDate' || value === 'title' ? value : 'createdDate';
    setSortBy(newSortBy as 'createdDate' | 'publishDate' | 'title');
    updateQueryParams(currentPage, { sortBy: newSortBy });
  };

  // 統合フィルタリング
  const handleCombinedFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value;
    setCombinedFilter(value);
    setCurrentPage(1);
    updateQueryParams(1, { filter: value });
  };

  // ページ変更
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateQueryParams(page);
  };

  // URLクエリパラメータを更新する関数
  const updateQueryParams = (
    page: number,
    additionalParams?: {
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      filter?: string;
    },
  ) => {
    setCurrentPage(page);
    const params = new URLSearchParams();

    params.set('page', page.toString());

    // 検索クエリ
    const searchValue =
      additionalParams?.search !== undefined
        ? additionalParams.search
        : searchQuery;
    if (searchValue) {
      params.set('search', searchValue);
    }

    // ソート基準
    const sortByValue =
      additionalParams?.sortBy !== undefined ? additionalParams.sortBy : sortBy;
    if (sortByValue) {
      params.set('sortBy', sortByValue);
    }

    // ソート順
    const sortOrderValue =
      additionalParams?.sortOrder !== undefined
        ? additionalParams.sortOrder
        : sortOrder;
    if (sortOrderValue) {
      params.set('sortOrder', sortOrderValue);
    }

    // フィルター
    const filterValue =
      additionalParams?.filter !== undefined
        ? additionalParams.filter
        : combinedFilter;
    if (filterValue && filterValue !== 'all') {
      params.set('filter', filterValue);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `/archive?${queryString}` : '/archive';

    startTransition(() => {
      router.push(newUrl);
    });
  };

  // 新規作成ハンドラ
  const handleCreateArchive = () => {
    router.push('/archive/create');
  };

  // 削除ボタンのハンドラー
  const handleDelete = (archiveId: string) => {
    setArchiveToDelete(archiveId);
    setIsDeleteModalOpen(true);
  };

  // 削除確認時の処理
  const confirmDelete = async () => {
    if (archiveToDelete) {
      try {
        const { error } = await supabase
          .from('mst_event_archive')
          .update({ deleted_at: new Date().toISOString() })
          .eq('archive_id', archiveToDelete);

        if (error) throw error;

        setArchives(
          archives.filter((archive) => archive.archive_id !== archiveToDelete),
        );
        setTotalCount(totalCount - 1);
        setIsDeleteModalOpen(false);
        setArchiveToDelete(null);

        // データを再取得
        router.refresh();
      } catch (error) {
        console.error('Error deleting archive:', error);
      }
    }
  };

  // 削除キャンセル時の処理
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setArchiveToDelete(null);
  };

  // ページネーション用の計算
  const totalPages = Math.ceil(totalCount / itemsPerPage);

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
            bg: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          })}
        >
          <div
            className={css({
              bg: 'white',
              p: 6,
              rounded: 'lg',
              shadow: 'xl',
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
          {/* ヘッダー部分 */}
          <ArchiveListHeader handleCreateArchive={handleCreateArchive} />

          {/* 検索・アクション部分 */}
          <ArchiveListSearch
            searchQuery={searchQuery}
            handleSearch={handleSearch}
            sortBy={sortBy}
            sortOrder={sortOrder}
            combinedFilter={combinedFilter}
            archiveTypes={archiveTypes}
            setSortBy={handleSortByChange}
            toggleSortOrder={toggleSortOrder}
            handleCombinedFilterChange={handleCombinedFilterChange}
          />

          {/* テーブル部分 - デスクトップ表示 */}
          <ArchiveListTable
            archives={archives}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />

          {/* カード表示 - モバイル表示 */}
          <ArchiveListCards
            archives={archives}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />

          {/* フッター部分 */}
          <ArchiveListFooter
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          itemName="アーカイブ"
          targetName={
            archives.find((a) => a.archive_id === archiveToDelete)?.title
          }
        />
      </div>
    </>
  );
};
