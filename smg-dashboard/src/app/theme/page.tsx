'use client';

import { ThemeListCards } from '@/components/themelist/ThemeListCards';
import { ThemeListFooter } from '@/components/themelist/ThemeListFooter';
import { ThemeListHeader } from '@/components/themelist/ThemeListHeader';
import { ThemeListSearch } from '@/components/themelist/ThemeListSearch';
import { ThemeListTable } from '@/components/themelist/ThemeListTable';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { createClient } from '@/lib/supabase/client';
import type { MstTheme } from '@/lib/supabase/types';
import { css } from '@/styled-system/css';
import { buildEditPageUrl } from '@/utils/navigation';
import { useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { Suspense, useEffect, useState } from 'react';

// SearchParamsを使用するコンポーネントを分離
function ThemeListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [themes, setThemes] = useState<MstTheme[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // モーダル用の状態を追加
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [themeToDelete, setThemeToDelete] = useState<string | null>(null);

  // URLからパラメータを取得し、状態を初期化
  useEffect(() => {
    if (searchParams && !isInitialized) {
      const pageParam = searchParams.get('page');
      const searchQueryParam = searchParams.get('search');
      const sortOrderParam = searchParams.get('sortOrder');
      const sortByParam = searchParams.get('sortBy');

      setCurrentPage(pageParam ? Number.parseInt(pageParam) : 1);

      if (searchQueryParam) {
        setSearchQuery(searchQueryParam);
        setInputValue(searchQueryParam); // 入力値も初期化
      }

      if (sortOrderParam === 'asc' || sortOrderParam === 'desc') {
        setSortOrder(sortOrderParam);
      }

      if (sortByParam === 'name' || sortByParam === 'date') {
        setSortBy(sortByParam);
      }

      setIsInitialized(true);
    }
  }, [searchParams, isInitialized]);

  // Supabaseからテーマデータを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('mst_theme')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setThemes(data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  // 編集ページへのリダイレクト
  const handleEdit = (themeId: string) => {
    const editUrl = buildEditPageUrl(`/theme/edit/${themeId}`, searchParams);
    router.push(editUrl);
  };

  // 入力値の変更処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // 検索実行処理
  const executeSearch = () => {
    setSearchQuery(inputValue);
    updateQueryParams(1, { search: inputValue });
  };

  // URLクエリパラメータを更新する関数
  const updateQueryParams = (
    page: number,
    additionalParams?: {
      search?: string;
      sortOrder?: 'asc' | 'desc';
      sortBy?: string;
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

    // ソート順
    const sortOrderValue =
      additionalParams?.sortOrder !== undefined
        ? additionalParams.sortOrder
        : sortOrder;
    if (sortOrderValue) {
      params.set('sortOrder', sortOrderValue);
    }

    // ソート基準
    const sortByValue =
      additionalParams?.sortBy !== undefined ? additionalParams.sortBy : sortBy;
    if (sortByValue) {
      params.set('sortBy', sortByValue);
    }

    router.push(`?${params.toString()}`);
  };

  // ソートとフィルタリングの処理
  const sortedAndFilteredThemes = themes
    .filter((theme) => {
      // 検索クエリによるフィルタリング
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        theme.theme_name.toLowerCase().includes(query) ||
        (theme.description?.toLowerCase().includes(query) ?? false);

      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.theme_name.localeCompare(b.theme_name)
          : b.theme_name.localeCompare(a.theme_name);
      }
      if (sortBy === 'date') {
        return sortOrder === 'asc'
          ? new Date(a.created_at || '').getTime() -
              new Date(b.created_at || '').getTime()
          : new Date(b.created_at || '').getTime() -
              new Date(a.created_at || '').getTime();
      }
      return 0;
    });

  // ページネーション用の計算
  const totalPages = Math.ceil(sortedAndFilteredThemes.length / itemsPerPage);

  // 現在のページに表示するテーマを取得
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentThemes = sortedAndFilteredThemes.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  // ページ変更ハンドラー
  const handlePageChange = (page: number) => {
    updateQueryParams(page);
  };

  // 削除ボタンのハンドラー
  const handleDelete = (themeId: string) => {
    setThemeToDelete(themeId);
    setIsDeleteModalOpen(true);
  };

  // 削除確認時の処理
  const confirmDelete = async () => {
    if (themeToDelete) {
      try {
        const { error } = await supabase
          .from('mst_theme')
          .update({ deleted_at: new Date().toISOString() })
          .eq('theme_id', themeToDelete);

        if (error) throw error;

        setThemes(themes.filter((theme) => theme.theme_id !== themeToDelete));
        setIsDeleteModalOpen(false);
        setThemeToDelete(null);
      } catch (error) {
        console.error('Error deleting theme:', error);
      }
    }
  };

  // 削除キャンセル時の処理
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setThemeToDelete(null);
  };

  // ソート順を切り替える関数
  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    updateQueryParams(currentPage, { sortOrder: newOrder });
  };

  // ソート基準変更の処理
  const handleSortByChange = (value: string) => {
    setSortBy(value);
    updateQueryParams(currentPage, { sortBy: value });
  };

  const handleCreateTheme = () => {
    router.push('/theme/create');
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  return (
    <>
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
          <ThemeListHeader handleCreateTheme={handleCreateTheme} />

          {/* 検索・アクション部分 */}
          <ThemeListSearch
            searchQuery={inputValue}
            handleInputChange={handleInputChange}
            executeSearch={executeSearch}
            sortBy={sortBy}
            sortOrder={sortOrder}
            setSortBy={handleSortByChange}
            toggleSortOrder={toggleSortOrder}
          />

          {/* テーブル部分 - デスクトップ表示 */}
          <ThemeListTable
            themes={currentThemes}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />

          {/* カード表示 - モバイル表示 */}
          <ThemeListCards
            themes={currentThemes}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />

          {/* フッター部分 */}
          <ThemeListFooter
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          itemName="テーマ"
          targetName={
            themes.find((t) => t.theme_id === themeToDelete)?.theme_name
          }
        />
      </div>
    </>
  );
}

// メインコンポーネント - Suspenseで囲む
const ThemeListPage = () => {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <ThemeListContent />
    </Suspense>
  );
};

export default ThemeListPage;
