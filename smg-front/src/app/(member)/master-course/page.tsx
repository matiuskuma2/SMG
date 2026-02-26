'use client';

import Banner from '@/components/events/Banner';
import { ListPagination } from '@/components/ui/ListPagination';
import NoticeAccordion from '@/components/notice/NoticeAccordion';
import SearchSection from '@/components/notice/SearchSection';
import type { NoticePageSearchParams } from '@/components/notice/types';
import {
	type NoticeListItem,
	getNotices,
} from '@/lib/api/notice';
import {
	type NoticeCategoryOption,
	getNoticeCategories,
} from '@/lib/api/notice-category';
import { css } from '@/styled-system/css';
import { useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { Suspense, useCallback, useEffect, useState } from 'react';

const ITEMS_PER_PAGE = 5;

const MasterCourseListContent = () => {
	const router = useRouter();
	const searchParams = useSearchParams();

	// URLクエリパラメータから検索条件を取得
	const currentPage = Math.max(
		1,
		Number.parseInt(searchParams.get('page') || '1', 10),
	);
	const searchTermParam = searchParams.get('search') || '';
	const sortOptionParam = (searchParams.get('sort') || 'date_desc') as
		| 'date_desc'
		| 'date_asc';
	const categoryIdParam = searchParams.get('category') || undefined;

	const [openNoticeId, setOpenNoticeId] = useState<number | null>(null);
	const [searchQuery, setSearchQuery] = useState(searchTermParam);

	const [notices, setNotices] = useState<NoticeListItem[]>([]);
	const [categories, setCategories] = useState<NoticeCategoryOption[]>([]);
	const [loading, setLoading] = useState(true);
	const [totalNotices, setTotalNotices] = useState(0);

	// URLパラメータが変更されたら検索クエリも更新
	useEffect(() => {
		setSearchQuery(searchTermParam);
	}, [searchTermParam]);

	const updateUrlParams = useCallback(
		(params: {
			search?: string;
			sort?: string;
			category?: string;
			page?: string;
		}) => {
			const newParams = new URLSearchParams(searchParams.toString());

			for (const [key, value] of Object.entries(params)) {
				if (value) {
					newParams.set(key, value);
				} else {
					newParams.delete(key);
				}
			}

			router.push(`/master-course?${newParams.toString()}`);
		},
		[router, searchParams],
	);

	const handleSearch = useCallback(
		(params: NoticePageSearchParams) => {
			updateUrlParams({
				search: params.searchTerm || undefined,
				sort: params.sortOption,
				category: params.categoryId,
				page: '1',
			});
		},
		[updateUrlParams],
	);

	const handleCategoryChange = useCallback(
		(categoryId: string | undefined) => {
			updateUrlParams({
				search: searchTermParam || undefined,
				sort: sortOptionParam,
				category: categoryId,
				page: '1',
			});
		},
		[updateUrlParams, searchTermParam, sortOptionParam],
	);

	const handleSearchQueryChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setSearchQuery(e.target.value);
		},
		[],
	);

	const handleSortChange = useCallback(
		(value: 'date_desc' | 'date_asc') => {
			updateUrlParams({
				search: searchTermParam || undefined,
				sort: value,
				category: categoryIdParam,
				page: '1',
			});
		},
		[updateUrlParams, searchTermParam, categoryIdParam],
	);

	const handleSearchSubmit = useCallback(() => {
		updateUrlParams({
			search: searchQuery || undefined,
			sort: sortOptionParam,
			category: categoryIdParam,
			page: '1',
		});
	}, [updateUrlParams, searchQuery, sortOptionParam, categoryIdParam]);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				// マスター講座カテゴリーとお知らせを並行して取得
				const [fetchedCategories, { notices: fetchedNotices, totalCount }] =
					await Promise.all([
						getNoticeCategories('master'),
						getNotices(
							searchTermParam,
							sortOptionParam,
							categoryIdParam,
							currentPage,
							ITEMS_PER_PAGE,
							'master',
						),
					]);

				setCategories(fetchedCategories);
				setNotices(fetchedNotices);
				setTotalNotices(totalCount);
			} catch (error) {
				console.error('データの取得に失敗しました:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [searchTermParam, sortOptionParam, categoryIdParam, currentPage]);

	const totalPages = Math.ceil(totalNotices / ITEMS_PER_PAGE);

	useEffect(() => {
		if (totalPages > 0 && currentPage > totalPages) {
			router.push(`/master-course?page=${totalPages}`);
		}
	}, [currentPage, router, totalPages]);

	return (
		<div
			className={css({
				maxW: '7xl',
				mx: 'auto',
				px: '4',
				'@media (min-width: 768px)': { px: '8' },
			})}
		>
			<Banner />
			<SearchSection
				searchQuery={searchQuery}
				sortOption={sortOptionParam}
				selectedCategoryId={categoryIdParam}
				categories={categories}
				onSearchQueryChange={handleSearchQueryChange}
				onSortChange={handleSortChange}
				onCategoryChange={handleCategoryChange}
				onSearch={handleSearchSubmit}
			/>
			{loading ? (
				<p
					className={css({
						color: 'gray.500',
						fontSize: 'md',
						textAlign: 'center',
						mt: '6',
					})}
				>
					読み込み中...
				</p>
			) : totalNotices === 0 ? (
				<p
					className={css({
						color: 'gray.500',
						fontSize: 'md',
						textAlign: 'center',
						mt: '6',
					})}
				>
					該当するマスター講座のお知らせは見つかりませんでした。
				</p>
			) : (
				<>
					{notices.map((notice) => (
						<NoticeAccordion
							key={notice.id}
							id={notice.id}
							noticeId={notice.noticeId}
							date={notice.date}
							title={notice.title}
							details={notice.details}
							category={notice.category}
							isOpen={openNoticeId === notice.id}
							onToggle={() => {
								setOpenNoticeId(openNoticeId === notice.id ? null : notice.id);
							}}
							basePath="/master-course"
							editType="notice"
						/>
					))}
					<ListPagination
						currentPage={currentPage}
						totalPages={totalPages}
						basePath="/master-course"
					/>
				</>
			)}
		</div>
	);
};

const MasterCourseListPaginated = () => {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<MasterCourseListContent />
		</Suspense>
	);
};

export default MasterCourseListPaginated;
