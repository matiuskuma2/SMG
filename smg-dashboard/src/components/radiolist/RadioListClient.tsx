'use client';

import { RadioListCards } from '@/components/radiolist/RadioListCards';
import { RadioListFooter } from '@/components/radiolist/RadioListFooter';
import { RadioListHeader } from '@/components/radiolist/RadioListHeader';
import { RadioListSearch } from '@/components/radiolist/RadioListSearch';
import { RadioListTable } from '@/components/radiolist/RadioListTable';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import type { Radio } from '@/types/radio';
import { buildEditPageUrl } from '@/utils/navigation';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

type RadioListClientProps = {
  initialRadios: Radio[];
  initialTotalCount: number;
  initialPage: number;
  initialSearchQuery: string;
  initialSortBy: 'created_at' | 'radio_name';
  initialSortOrder: 'asc' | 'desc';
};

export const RadioListClient = ({
  initialRadios,
  initialTotalCount,
  initialPage,
  initialSearchQuery,
  initialSortBy,
  initialSortOrder,
}: RadioListClientProps) => {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [radios, setRadios] = useState<Radio[]>(initialRadios);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [sortBy, setSortBy] = useState<'created_at' | 'radio_name'>(
    initialSortBy,
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);
  const [itemsPerPage] = useState(10);

  // モーダル用の状態
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [radioToDelete, setRadioToDelete] = useState<string | null>(null);

  // Server Componentから新しいデータを受け取ったら更新
  useEffect(() => {
    setRadios(initialRadios);
    setTotalCount(initialTotalCount);
    setCurrentPage(initialPage);
    setSearchQuery(initialSearchQuery);
    setSortBy(initialSortBy);
    setSortOrder(initialSortOrder);
  }, [
    initialRadios,
    initialTotalCount,
    initialPage,
    initialSearchQuery,
    initialSortBy,
    initialSortOrder,
  ]);

  // 検索処理
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    updateQueryParams(1, { search: query });
  };

  // ソートオーダー切り替え
  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    setCurrentPage(1);
    updateQueryParams(1, { sortOrder: newOrder });
  };

  // ソート基準変更
  const handleSortByChange = (value: string) => {
    const newSortBy = value === 'radio_name' ? 'radio_name' : 'created_at';
    setSortBy(newSortBy);
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
      sortBy?: 'created_at' | 'radio_name';
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
    const newUrl = queryString ? `/radiolist?${queryString}` : '/radiolist';

    startTransition(() => {
      router.push(newUrl);
    });
  };

  // 新規作成ハンドラ
  const handleCreateRadio = () => {
    router.push('/radio/create');
  };

  // 編集ハンドラ
  const handleEdit = (radioId: string) => {
    const editUrl = buildEditPageUrl(`/radio/edit/${radioId}`, searchParams);
    router.push(editUrl);
  };

  // 削除ハンドラ
  const handleDelete = (radioId: string) => {
    setRadioToDelete(radioId);
    setIsDeleteModalOpen(true);
  };

  // 削除確認ハンドラ
  const handleDeleteConfirm = async () => {
    if (!radioToDelete) return;

    try {
      const { error } = await supabase
        .from('mst_radio')
        .update({ deleted_at: new Date().toISOString() })
        .eq('radio_id', radioToDelete);

      if (error) throw error;

      // ラジオリストを更新（再取得）
      setRadios(radios.filter((radio) => radio.radio_id !== radioToDelete));
      setTotalCount(totalCount - 1);
      setIsDeleteModalOpen(false);
      setRadioToDelete(null);

      // データを再取得
      router.refresh();
    } catch (error) {
      console.error('ラジオの削除エラー:', error);
      alert('ラジオの削除に失敗しました');
    }
  };

  // 削除キャンセルハンドラ
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setRadioToDelete(null);
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
          <RadioListHeader handleCreateRadio={handleCreateRadio} />

          {/* 検索・アクション部分 */}
          <RadioListSearch
            searchQuery={searchQuery}
            handleSearch={handleSearch}
            sortBy={sortBy}
            sortOrder={sortOrder}
            setSortBy={handleSortByChange}
            toggleSortOrder={toggleSortOrder}
          />

          {/* テーブル表示 */}
          <RadioListTable
            radios={radios}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />

          {/* カード表示 */}
          <RadioListCards
            radios={radios}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />

          {/* フッター部分 */}
          <RadioListFooter
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName="ラジオ"
        targetName={
          radios.find((r) => r.radio_id === radioToDelete)?.radio_name
        }
      />
    </>
  );
};
