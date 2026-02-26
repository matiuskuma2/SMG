'use client';

import type { Notice, NoticeCategoryBasic } from '@/components/notice/types';
import { NoticeListCards } from '@/components/noticelist/NoticeListCards';
import { NoticeListFooter } from '@/components/noticelist/NoticeListFooter';
import { NoticeListSearch } from '@/components/noticelist/NoticeListSearch';
import { NoticeListTable } from '@/components/noticelist/NoticeListTable';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import { buildEditPageUrl } from '@/utils/navigation';
import { useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { Suspense, useEffect, useState } from 'react';
import { FaPlus } from 'react-icons/fa';

const CATEGORY_TYPE = 'master';

function MasterCourseListContent() {
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState<string | null>(null);
  const [masterCategoryIds, setMasterCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    if (searchParams && !isInitialized) {
      const pageParam = searchParams.get('page');
      const searchQueryParam = searchParams.get('search');
      const sortOrderParam = searchParams.get('sortOrder');
      const sortByParam = searchParams.get('sortBy');
      const categoryParam = searchParams.get('category');

      setCurrentPage(pageParam ? Number.parseInt(pageParam) : 1);
      if (searchQueryParam) setSearchQuery(searchQueryParam);
      if (sortOrderParam === 'asc' || sortOrderParam === 'desc') setSortOrder(sortOrderParam);
      if (sortByParam === 'date' || sortByParam === 'postPeriod') setSortBy(sortByParam);
      if (categoryParam) setSelectedCategory(categoryParam);

      setIsInitialized(true);
    }
  }, [searchParams, isInitialized]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: categoryData, error: categoryError } = await supabase
          .from('mst_notice_category')
          .select('category_id, category_name, description')
          .eq('description', CATEGORY_TYPE)
          .is('deleted_at', null)
          .order('created_at');

        if (categoryError) throw categoryError;

        const masterCatIds = (categoryData || []).map((c) => c.category_id);
        setMasterCategoryIds(masterCatIds);
        setCategories(categoryData || []);

        let query = supabase
          .from('mst_notice')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (masterCatIds.length > 0) {
          query = query.in('category_id', masterCatIds);
        } else {
          setNotices([]);
          setIsLoading(false);
          return;
        }

        const { data: noticeData, error: noticeError } = await query;
        if (noticeError) throw noticeError;

        const categoryMap = new Map(
          (categoryData || []).map((cat) => [cat.category_id, cat]),
        );

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
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const handleEdit = (noticeId: string) => {
    const editUrl = buildEditPageUrl(`/mastercourse/edit/${noticeId}`, searchParams);
    router.push(editUrl);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    updateQueryParams(1, { search: value });
  };

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

    const searchValue = additionalParams?.search !== undefined ? additionalParams.search : searchQuery;
    if (searchValue) params.set('search', searchValue);

    const sortOrderValue = additionalParams?.sortOrder !== undefined ? additionalParams.sortOrder : sortOrder;
    if (sortOrderValue) params.set('sortOrder', sortOrderValue);

    const sortByValue = additionalParams?.sortBy !== undefined ? additionalParams.sortBy : sortBy;
    if (sortByValue) params.set('sortBy', sortByValue);

    const categoryValue = additionalParams?.category !== undefined ? additionalParams.category : selectedCategory;
    if (categoryValue) params.set('category', categoryValue);

    router.push(`?${params.toString()}`);
  };

  const getTimeOrZero = (value: string | null): number => {
    return value ? new Date(value).getTime() : 0;
  };

  const sortedAndFilteredNotices = notices
    .filter((notice) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        notice.title.toLowerCase().includes(query) ||
        notice.content.toLowerCase().includes(query);
      const matchesCategory = !selectedCategory || notice.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'asc'
          ? new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
          : new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      }
      if (sortBy === 'postPeriod') {
        const aStart = getTimeOrZero(a.publish_start_at);
        const bStart = getTimeOrZero(b.publish_start_at);
        if (aStart !== bStart) return sortOrder === 'asc' ? aStart - bStart : bStart - aStart;
        const aEnd = getTimeOrZero(a.publish_end_at);
        const bEnd = getTimeOrZero(b.publish_end_at);
        return sortOrder === 'asc' ? aEnd - bEnd : bEnd - aEnd;
      }
      return 0;
    });

  const totalPages = Math.ceil(sortedAndFilteredNotices.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNotices = sortedAndFilteredNotices.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => updateQueryParams(page);

  const handleDelete = (noticeId: string) => {
    setNoticeToDelete(noticeId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (noticeToDelete) {
      try {
        const { error } = await supabase
          .from('mst_notice')
          .update({ deleted_at: new Date().toISOString() })
          .eq('notice_id', noticeToDelete);
        if (error) throw error;
        setNotices(notices.filter((notice) => notice.notice_id !== noticeToDelete));
        setIsDeleteModalOpen(false);
        setNoticeToDelete(null);
      } catch (error) {
        console.error('Error deleting notice:', error);
      }
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setNoticeToDelete(null);
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    updateQueryParams(currentPage, { sortOrder: newOrder });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    updateQueryParams(1, { category });
  };

  const handleSortByChange = (value: string) => {
    setSortBy(value);
    updateQueryParams(currentPage, { sortBy: value });
  };

  const handleCreateNotice = () => {
    router.push('/mastercourse/create');
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
          <div
            className={css({
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'gray.200',
              p: { base: '3', xl: '4' },
              position: 'relative',
            })}
          >
            <h1
              className={css({
                fontSize: { base: 'lg', xl: 'xl' },
                fontWeight: 'bold',
              })}
            >
              マスター講座
            </h1>
            <Button
              className={css({
                display: 'flex',
                alignItems: 'center',
                gap: '2',
                bg: 'blue.600',
                color: 'white',
                _hover: { bg: 'blue.700' },
                px: { base: '3', xl: '4' },
                py: { base: '1.5', xl: '2' },
                rounded: 'md',
                position: 'absolute',
                right: { base: '2', xl: '4' },
                fontSize: { base: 'sm', xl: 'md' },
                whiteSpace: 'nowrap',
                mt: { base: '2', xl: '0' },
                cursor: 'pointer',
              })}
              onClick={handleCreateNotice}
            >
              <FaPlus
                size={14}
                className={css({ display: { base: 'none', xl: 'block' } })}
              />
              <span className={css({ display: { base: 'none', xl: 'inline' } })}>
                マスター講座投稿の作成
              </span>
              <span className={css({ display: { base: 'inline', xl: 'none' } })}>
                作成
              </span>
            </Button>
          </div>

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

          <NoticeListTable
            notices={currentNotices}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />

          <NoticeListCards
            notices={currentNotices}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />

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
          itemName="マスター講座投稿"
          targetName={notices.find((n) => n.notice_id === noticeToDelete)?.title}
        />
      </div>
    </>
  );
}

const MasterCourseListPage = () => {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <MasterCourseListContent />
    </Suspense>
  );
};

export default MasterCourseListPage;
