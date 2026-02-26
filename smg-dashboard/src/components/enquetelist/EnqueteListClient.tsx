'use client';

import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { Pagination } from '@/components/ui/Pagination';
import { css } from '@/styled-system/css';
import { useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import { EnqueteCard } from './EnqueteCard';
import { EnqueteListHeader } from './EnqueteListHeader';
import { EnqueteTable } from './EnqueteTable';
import { SearchBar } from './SearchBar';
import { sampleEnquetes } from './constants';
import type { Enquete } from './types';

export const EnqueteListClient = () => {
  const router = useRouter();

  // useSearchParamsの結果を状態として管理し、useEffectで初期化する
  const [currentPage, setCurrentPage] = useState(1);

  // searchParamsはクライアントサイドでのみ使用
  const searchParams = useSearchParams();

  const [enquetes, setEnquetes] = useState<Enquete[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnquetes, setSelectedEnquetes] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [itemsPerPage] = useState(2);
  const [sortField, setSortField] = useState<keyof Enquete>('eventName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // モーダル用の状態を追加
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [enqueteToDelete, setEnqueteToDelete] = useState<string | null>(null);

  // URLからパラメータを取得し、状態を初期化
  useEffect(() => {
    if (searchParams && !isInitialized) {
      const pageParam = searchParams.get('page');
      const sortFieldParam = searchParams.get('sortField');
      const sortDirectionParam = searchParams.get('sortDirection');
      const searchQueryParam = searchParams.get('search');

      setCurrentPage(pageParam ? Number.parseInt(pageParam) : 1);

      if (
        sortFieldParam === 'eventName' ||
        sortFieldParam === 'eventDate' ||
        sortFieldParam === 'responseDeadline'
      ) {
        setSortField(sortFieldParam as keyof Enquete);
      }

      if (sortDirectionParam === 'asc' || sortDirectionParam === 'desc') {
        setSortDirection(sortDirectionParam);
      }

      if (searchQueryParam) {
        setSearchQuery(searchQueryParam);
      }

      setIsInitialized(true);
    }
  }, [searchParams, isInitialized]);

  // 初期データの読み込み
  useEffect(() => {
    const loadEnquetes = async () => {
      try {
        // 実際のAPI呼び出しに置き換える
        setEnquetes(sampleEnquetes);
      } catch (error) {
        console.error('Failed to load enquetes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEnquetes();
  }, []);

  // 検索処理
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    // 検索時はページを1に戻す
    updateQueryParams(1, { search: value });
  };

  // URLクエリパラメータを更新する関数
  const updateQueryParams = (
    page: number,
    additionalParams?: {
      search?: string;
      sortField?: keyof Enquete;
      sortDirection?: 'asc' | 'desc';
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

    // ソートフィールド
    const sortFieldValue =
      additionalParams?.sortField !== undefined
        ? additionalParams.sortField
        : sortField;
    if (sortFieldValue) {
      params.set('sortField', sortFieldValue);
    }

    // ソート方向
    const sortDirectionValue =
      additionalParams?.sortDirection !== undefined
        ? additionalParams.sortDirection
        : sortDirection;
    if (sortDirectionValue) {
      params.set('sortDirection', sortDirectionValue);
    }

    router.push(`?${params.toString()}`);
  };

  // ソート処理
  const handleSort = (field: 'eventDate' | 'responseDeadline') => {
    let newDirection: 'asc' | 'desc' = 'asc';
    if (sortField === field) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    setSortField(field);
    setSortDirection(newDirection);
    updateQueryParams(currentPage, {
      sortField: field,
      sortDirection: newDirection,
    });
  };

  // 削除ボタンのハンドラー
  const handleDelete = (enqueteId: string) => {
    setEnqueteToDelete(enqueteId);
    setIsDeleteModalOpen(true);
  };

  // 削除確認時の処理
  const confirmDelete = () => {
    if (enqueteToDelete) {
      setEnquetes(enquetes.filter((enquete) => enquete.id !== enqueteToDelete));
      setIsDeleteModalOpen(false);
      setEnqueteToDelete(null);
    }
  };

  // 削除キャンセル時の処理
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setEnqueteToDelete(null);
  };

  // フィルタリングとソートを適用したアンケートリスト
  const filteredEnquetes = enquetes
    .filter((enquete) => {
      const query = searchQuery.toLowerCase();
      return (
        enquete.id.toLowerCase().includes(query) ||
        enquete.eventName.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const aValue = a[sortField]?.toString() || '';
      const bValue = b[sortField]?.toString() || '';

      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      }
      return bValue.localeCompare(aValue);
    });

  // 個別選択の処理
  const handleSelectEnquete = (enqueteId: string) => {
    if (selectedEnquetes.includes(enqueteId)) {
      setSelectedEnquetes(selectedEnquetes.filter((id) => id !== enqueteId));
    } else {
      setSelectedEnquetes([...selectedEnquetes, enqueteId]);
    }
  };

  // 画面サイズの検出
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 初期チェック
    checkIfMobile();

    // リサイズイベントリスナー
    window.addEventListener('resize', checkIfMobile);

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // 選択状態が変更されたときに全選択チェックボックスの状態を更新
  useEffect(() => {
    setSelectAll(
      filteredEnquetes.length > 0 &&
        selectedEnquetes.length === filteredEnquetes.length,
    );
  }, [selectedEnquetes, filteredEnquetes]);

  // ページネーション用の計算
  const totalPages = Math.ceil(filteredEnquetes.length / itemsPerPage);

  // 現在のページに表示するアンケートを取得
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEnquetes = filteredEnquetes.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  // ページ変更ハンドラー
  const handlePageChange = (page: number) => {
    updateQueryParams(page);
  };

  if (isLoading) {
    return (
      <div
        className={css({
          p: { base: '2', md: '8' },
          pt: { base: '4', md: '20' },
          minH: 'calc(100vh - 64px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        })}
      >
        <div>読み込み中...</div>
      </div>
    );
  }

  return (
    <>
      {/* ヘッダー部分 */}
      <EnqueteListHeader />

      {/* 検索部分 */}
      <SearchBar
        sortBy={
          sortField === 'eventDate'
            ? 'eventDate'
            : sortField === 'responseDeadline'
              ? 'responseDeadline'
              : null
        }
        sortOrder={sortDirection}
        handleSort={handleSort}
      />

      {/* テーブル部分 - デスクトップ表示 */}
      <EnqueteTable
        currentEnquetes={currentEnquetes}
        selectedEnquetes={selectedEnquetes}
        handleSelectEnquete={handleSelectEnquete}
        handleDelete={handleDelete}
      />

      {/* カード表示 - モバイル表示 */}
      <EnqueteCard
        currentEnquetes={currentEnquetes}
        selectedEnquetes={selectedEnquetes}
        handleSelectEnquete={handleSelectEnquete}
        handleDelete={handleDelete}
      />

      {/* フッター部分 */}
      <div
        className={css({
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          p: { base: '3', md: '4' },
          borderTop: '1px solid',
          borderColor: 'gray.200',
          flexDirection: { base: 'column', md: 'row' },
          gap: { base: '3', md: '0' },
        })}
      >
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* 削除確認モーダル */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        itemName="アンケート"
        targetName={enquetes.find((e) => e.id === enqueteToDelete)?.eventName}
      />
    </>
  );
};
