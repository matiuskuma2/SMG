'use client';

import type { Notice, NoticeCategoryBasic } from '@/components/notice/types';
import { NoticeListCards } from '@/components/noticelist/NoticeListCards';
import { NoticeListFooter } from '@/components/noticelist/NoticeListFooter';
import { NoticeListHeader } from '@/components/noticelist/NoticeListHeader';
import { NoticeListSearch } from '@/components/noticelist/NoticeListSearch';
import { NoticeListTable } from '@/components/noticelist/NoticeListTable';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import { buildEditPageUrl } from '@/utils/navigation';
import { useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { Suspense, useEffect, useState } from 'react';

// SearchParamsを使用するコンポーネントを分離
function NoticeListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<NoticeCategoryBasic[]>([]);
  const [itemsPerPage] = useState(5);
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // モーダル用の状態を追加
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState<string | null>(null);

  // URLからパラメータを取得し、状態を初期化
  useEffect(() => {
    if (searchParams && !isInitialized) {
      const pageParam = searchParams.get('page');
      const searchQueryParam = searchParams.get('search');
      const sortOrderParam = searchParams.get('sortOrder');
      const sortByParam = searchParams.get('sortBy');
      const categoryParam = searchParams.get('category');

      setCurrentPage(pageParam ? Number.parseInt(pageParam) : 1);

      if (searchQueryParam) {
        setSearchQuery(searchQueryParam);
      }

      if (sortOrderParam === 'asc' || sortOrderParam === 'desc') {
        setSortOrder(sortOrderParam);
      }

      if (sortByParam === 'date' || sortByParam === 'postPeriod') {
        setSortBy(sortByParam);
      }

      if (categoryParam) {
        setSelectedCategory(categoryParam);
      }

      setIsInitialized(true);
    }
  }, [searchParams, isInitialized]);

  // Supabaseからお知らせデータとカテゴリーデータを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        // お知らせデータを取得
        const { data: noticeData, error: noticeError } = await supabase
          .from('mst_notice')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (noticeError) throw noticeError;

        // カテゴリーデータを取得
        const { data: categoryData, error: categoryError } = await supabase
          .from('mst_notice_category')
          .select('category_id, category_name')
          .is('deleted_at', null)
          .order('created_at');

        if (categoryError) throw categoryError;

        // カテゴリーをマップ形式で変換
        const categoryMap = new Map(
          (categoryData || []).map((cat) => [cat.category_id, cat]),
        );

        // データをNotice型に変換（カテゴリー情報をマップから取得）
        const formattedNotices: Notice[] = (noticeData || []).map((notice) => ({
          notice_id: notice.notice_id,
          title: notice.title,
          content: notice.content,
          category_id: notice.category_id,
          created_at: notice.created_at || new Date().toISOString(),
          updated_at: notice.updated_at,
          publish_start_at: notice.publish_start_at,
          publish_end_at: notice.publish_end_at,
          deleted_at: notice.deleted_at,
          is_draft: notice.is_draft,
          category: notice.category_id
            ? categoryMap.get(notice.category_id) || null
            : null,
        }));

        setNotices(formattedNotices);
        setCategories(categoryData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  // 編集ページへのリダイレクト
  const handleEdit = (noticeId: string) => {
    const editUrl = buildEditPageUrl(`/notice/edit/${noticeId}`, searchParams);
    router.push(editUrl);
  };

  // 検索処理
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    updateQueryParams(1, { search: value });
  };

  // URLクエリパラメータを更新する関数
  const updateQueryParams = (
    page: number,
    additionalParams?: {
      search?: string;
      sortOrder?: 'asc' | 'desc';
      sortBy?: string;
      category?: string;
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

    // カテゴリーフィルター
    const categoryValue =
      additionalParams?.category !== undefined
        ? additionalParams.category
        : selectedCategory;
    if (categoryValue) {
      params.set('category', categoryValue);
    }

    router.push(`?${params.toString()}`);
  };

  const getTimeOrZero = (value: string | null): number => {
    return value ? new Date(value).getTime() : 0;
  };

  // ソートとフィルタリングの処理
  const sortedAndFilteredNotices = notices
    .filter((notice) => {
      // 検索クエリによるフィルタリング
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        notice.title.toLowerCase().includes(query) ||
        notice.content.toLowerCase().includes(query);

      // カテゴリーによるフィルタリング
      const matchesCategory =
        !selectedCategory || notice.category_id === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'asc'
          ? new Date(a.created_at || '').getTime() -
              new Date(b.created_at || '').getTime()
          : new Date(b.created_at || '').getTime() -
              new Date(a.created_at || '').getTime();
      }

      if (sortBy === 'postPeriod') {
        const aStart = getTimeOrZero(a.publish_start_at);
        const bStart = getTimeOrZero(b.publish_start_at);
        if (aStart !== bStart) {
          return sortOrder === 'asc' ? aStart - bStart : bStart - aStart;
        }

        const aEnd = getTimeOrZero(a.publish_end_at);
        const bEnd = getTimeOrZero(b.publish_end_at);
        return sortOrder === 'asc' ? aEnd - bEnd : bEnd - aEnd;
      }

      return 0;
    });

  // ページネーション用の計算
  const totalPages = Math.ceil(sortedAndFilteredNotices.length / itemsPerPage);

  // 現在のページに表示するお知らせを取得
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNotices = sortedAndFilteredNotices.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  // ページ変更ハンドラー
  const handlePageChange = (page: number) => {
    updateQueryParams(page);
  };

  // 削除ボタンのハンドラー
  const handleDelete = (noticeId: string) => {
    setNoticeToDelete(noticeId);
    setIsDeleteModalOpen(true);
  };

  // 削除確認時の処理
  const confirmDelete = async () => {
    if (noticeToDelete) {
      try {
        const { error } = await supabase
          .from('mst_notice')
          .update({ deleted_at: new Date().toISOString() })
          .eq('notice_id', noticeToDelete);

        if (error) throw error;

        setNotices(
          notices.filter((notice) => notice.notice_id !== noticeToDelete),
        );
        setIsDeleteModalOpen(false);
        setNoticeToDelete(null);
      } catch (error) {
        console.error('Error deleting notice:', error);
      }
    }
  };

  // 削除キャンセル時の処理
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setNoticeToDelete(null);
  };

  // ソート順を切り替える関数
  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    updateQueryParams(currentPage, { sortOrder: newOrder });
  };

  // カテゴリー変更時の処理
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    updateQueryParams(1, { category });
  };

  // ソート基準変更の処理
  const handleSortByChange = (value: string) => {
    setSortBy(value);
    updateQueryParams(currentPage, { sortBy: value });
  };

  const handleCreateNotice = () => {
    router.push('/notice/create');
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
          <NoticeListHeader handleCreateNotice={handleCreateNotice} />

          {/* 検索・アクション部分 */}
          <NoticeListSearch
            searchQuery={searchQuery}
            handleSearch={handleSearch}
            selectedCategory={selectedCategory}
            categories={categories}
            onCategoryChange={handleCategoryChange}
            sortBy={sortBy}
            sortOrder={sortOrder}
            setSortBy={handleSortByChange}
            toggleSortOrder={toggleSortOrder}
          />

          {/* テーブル部分 - デスクトップ表示 */}
          <NoticeListTable
            notices={currentNotices}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />

          {/* カード表示 - モバイル表示 */}
          <NoticeListCards
            notices={currentNotices}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />

          {/* フッター部分 */}
          <NoticeListFooter
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          itemName="お知らせ"
          targetName={
            notices.find((n) => n.notice_id === noticeToDelete)?.title
          }
        />
      </div>
    </>
  );
}

// メインコンポーネント - Suspenseで囲む
const NoticeListPage = () => {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <NoticeListContent />
    </Suspense>
  );
};

export default NoticeListPage;
