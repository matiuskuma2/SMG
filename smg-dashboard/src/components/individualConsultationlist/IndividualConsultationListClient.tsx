'use client';

import { IndividualConsultationListCards } from '@/components/individualConsultationlist/IndividualConsultationListCards';
import { IndividualConsultationListFooter } from '@/components/individualConsultationlist/IndividualConsultationListFooter';
import { IndividualConsultationListHeader } from '@/components/individualConsultationlist/IndividualConsultationListHeader';
import { IndividualConsultationListSearch } from '@/components/individualConsultationlist/IndividualConsultationListSearch';
import { IndividualConsultationListTable } from '@/components/individualConsultationlist/IndividualConsultationListTable';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import type { IndividualConsultationType } from '@/types/individualConsultation';
import { buildEditPageUrl } from '@/utils/navigation';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

type IndividualConsultationListClientProps = {
  initialConsultations: IndividualConsultationType[];
  initialTotalCount: number;
  initialPage: number;
  initialSearchQuery: string;
  initialSortBy: 'createdDate' | 'applicationDate' | 'title';
  initialSortOrder: 'asc' | 'desc';
};

export const IndividualConsultationListClient = ({
  initialConsultations,
  initialTotalCount,
  initialPage,
  initialSearchQuery,
  initialSortBy,
  initialSortOrder,
}: IndividualConsultationListClientProps) => {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [consultations, setConsultations] =
    useState<IndividualConsultationType[]>(initialConsultations);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [sortBy, setSortBy] = useState<
    'createdDate' | 'applicationDate' | 'title'
  >(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);
  const [itemsPerPage] = useState(5);

  // モーダル用の状態
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Server Componentから新しいデータを受け取ったら更新
  useEffect(() => {
    setConsultations(initialConsultations);
    setTotalCount(initialTotalCount);
    setCurrentPage(initialPage);
    setSearchQuery(initialSearchQuery);
    setSortBy(initialSortBy);
    setSortOrder(initialSortOrder);
  }, [
    initialConsultations,
    initialTotalCount,
    initialPage,
    initialSearchQuery,
    initialSortBy,
    initialSortOrder,
  ]);

  // 参加者一覧ページへのリダイレクト
  const handleViewParticipants = (consultationId: string) => {
    router.push(`/individualConsultation/participants/${consultationId}`);
  };

  // 編集ページへのリダイレクト
  const handleEdit = (consultationId: string) => {
    const editUrl = buildEditPageUrl(
      `/individualConsultation/edit/${consultationId}`,
      searchParams,
    );
    router.push(editUrl);
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
    updateQueryParams(currentPage, { sortOrder: newOrder });
  };

  // ソート基準変更
  const handleSortByChange = (value: string) => {
    const newSortBy =
      value === 'applicationDate' || value === 'title' ? value : 'createdDate';
    setSortBy(newSortBy as 'createdDate' | 'applicationDate' | 'title');
    updateQueryParams(currentPage, { sortBy: newSortBy });
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

    const queryString = params.toString();
    const newUrl = queryString
      ? `/individualConsultationlist?${queryString}`
      : '/individualConsultationlist';

    startTransition(() => {
      router.push(newUrl);
    });
  };

  // 新規作成ハンドラ
  const handleCreateIndividualConsultation = () => {
    router.push('/individualConsultation/create');
  };

  // 削除処理
  const handleDelete = async (consultationId: string) => {
    setItemToDelete(consultationId);
    setIsDeleteModalOpen(true);
  };

  // 削除確認時の処理
  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        const { error } = await supabase
          .from('mst_consultation')
          .update({ deleted_at: new Date().toISOString() })
          .eq('consultation_id', itemToDelete);

        if (error) throw error;

        setConsultations(
          consultations.filter(
            (consultation) => consultation.consultation_id !== itemToDelete,
          ),
        );
        setTotalCount(totalCount - 1);
        setIsDeleteModalOpen(false);
        setItemToDelete(null);

        // データを再取得
        router.refresh();
      } catch (error) {
        console.error('削除に失敗しました:', error);
      }
    }
  };

  // 削除キャンセル時の処理
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
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
          <IndividualConsultationListHeader
            handleCreateIndividualConsultation={
              handleCreateIndividualConsultation
            }
          />

          {/* 検索・アクション部分 */}
          <IndividualConsultationListSearch
            searchQuery={searchQuery}
            handleSearch={handleSearch}
            sortBy={sortBy}
            sortOrder={sortOrder}
            setSortBy={handleSortByChange}
            toggleSortOrder={toggleSortOrder}
          />

          {/* テーブル部分 - デスクトップ表示 */}
          <IndividualConsultationListTable
            individualConsultations={consultations}
            handleViewParticipants={handleViewParticipants}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />

          {/* カード表示 - モバイル表示 */}
          <IndividualConsultationListCards
            individualConsultations={consultations}
            handleViewParticipants={handleViewParticipants}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />

          {/* フッター部分 */}
          <IndividualConsultationListFooter
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          itemName="個別相談"
          targetName={
            consultations.find((c) => c.consultation_id === itemToDelete)
              ?.title ?? undefined
          }
        />
      </div>
    </>
  );
};
