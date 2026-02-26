'use client';

import { QuestionListCards } from '@/components/questionlist/QuestionListCards';
import { QuestionListFooter } from '@/components/questionlist/QuestionListFooter';
import { QuestionListHeader } from '@/components/questionlist/QuestionListHeader';
import { QuestionListSearch } from '@/components/questionlist/QuestionListSearch';
import { QuestionListTable } from '@/components/questionlist/QuestionListTable';
import type {
  FilterType,
  Question,
  SortKey,
} from '@/components/questionlist/QuestionTypes';
import { toggleQuestionVisibilityApi } from '@/lib/api/questions';
import { css } from '@/styled-system/css';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState, useTransition } from 'react';

type QuestionListClientProps = {
  initialQuestions: Question[];
  initialTotalCount: number;
  initialInstructors: { id: string; name: string }[];
  initialPage: number;
  initialSearchQuery: string;
  initialSortBy: SortKey;
  initialSortOrder: 'asc' | 'desc';
  initialFilterType: FilterType;
  initialInstructorId: string;
  initialIsAnsweredOnly: boolean;
  initialIsVisibleOnly: boolean;
};

export const QuestionListClient = ({
  initialQuestions,
  initialTotalCount,
  initialInstructors,
  initialPage,
  initialSearchQuery,
  initialSortBy,
  initialSortOrder,
  initialFilterType,
  initialInstructorId,
  initialIsAnsweredOnly,
  initialIsVisibleOnly,
}: QuestionListClientProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 状態管理（UI操作用のローカル状態）
  const [localQuestions, setLocalQuestions] =
    useState<Question[]>(initialQuestions);
  const [sortBy, setSortBy] = useState<SortKey>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);
  const [filterType, setFilterType] = useState<FilterType>(initialFilterType);
  const [selectedInstructor, setSelectedInstructor] =
    useState(initialInstructorId);
  const [isAnsweredOnly, setIsAnsweredOnly] = useState(initialIsAnsweredOnly);
  const [isVisibleOnly, setIsVisibleOnly] = useState(initialIsVisibleOnly);
  const itemsPerPage = 5;

  // サーバーからのデータを直接使用（ページネーション中は props が更新される）
  const questions = isPending ? localQuestions : initialQuestions;
  const totalCount = initialTotalCount;
  const instructors = initialInstructors;
  const currentPage = initialPage;

  // URLクエリパラメータを更新する関数
  const updateQueryParams = (
    page: number,
    additionalParams?: {
      search?: string;
      sortOrder?: 'asc' | 'desc';
      sortBy?: SortKey;
      filterType?: FilterType;
      instructor?: string;
      answeredOnly?: boolean;
      visibleOnly?: boolean;
    },
  ) => {
    const params = new URLSearchParams();

    params.set('page', page.toString());

    // 検索クエリ
    const searchValue = additionalParams?.search ?? initialSearchQuery;
    if (searchValue) {
      params.set('search', searchValue);
    }

    // ソート順
    const sortOrderValue = additionalParams?.sortOrder ?? sortOrder;
    params.set('sortOrder', sortOrderValue);

    // ソート基準
    const sortByValue = additionalParams?.sortBy ?? sortBy;
    params.set('sortBy', sortByValue);

    // フィルタータイプ
    const filterTypeValue = additionalParams?.filterType ?? filterType;
    params.set('filterType', filterTypeValue);

    // 講師フィルター
    const instructorValue = additionalParams?.instructor ?? selectedInstructor;
    if (instructorValue) {
      params.set('instructor', instructorValue);
    }

    // 回答済みフィルター
    const answeredOnlyValue = additionalParams?.answeredOnly ?? isAnsweredOnly;
    if (answeredOnlyValue) {
      params.set('answeredOnly', 'true');
    }

    // 表示中のみフィルター
    const visibleOnlyValue = additionalParams?.visibleOnly ?? isVisibleOnly;
    if (visibleOnlyValue) {
      params.set('visibleOnly', 'true');
    }

    const queryString = params.toString();
    const newUrl = queryString
      ? `/questionlist?${queryString}`
      : '/questionlist';

    startTransition(() => {
      router.push(newUrl);
    });
  };

  // 各種ハンドラー
  const handleSearch = (query: string) => {
    updateQueryParams(1, { search: query });
  };

  const handleSortByChange = (value: SortKey) => {
    setSortBy(value);
    updateQueryParams(currentPage, { sortBy: value });
  };

  const handleFilterTypeChange = (type: FilterType) => {
    setFilterType(type);
    // anonymousの場合はvisibleOnlyをfalseにリセット
    if (type === 'anonymous') {
      setIsVisibleOnly(false);
      updateQueryParams(1, { filterType: type, visibleOnly: false });
    } else {
      updateQueryParams(1, { filterType: type });
    }
  };

  const handleSortOrderToggle = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    updateQueryParams(1, { sortOrder: newOrder });
  };

  const handleInstructorChange = (instructorId: string) => {
    setSelectedInstructor(instructorId);
    updateQueryParams(1, { instructor: instructorId });
  };

  const handleAnsweredOnlyChange = (value: boolean) => {
    setIsAnsweredOnly(value);
    updateQueryParams(1, { answeredOnly: value });
  };

  const handleVisibleOnlyChange = (value: boolean) => {
    setIsVisibleOnly(value);
    updateQueryParams(1, { visibleOnly: value });
  };

  const handlePageChange = (page: number) => {
    updateQueryParams(page);
  };

  // 表示/非表示の切り替え
  const toggleVisibility = async (id: string) => {
    try {
      const question = questions.find((q) => q.question_id === id);
      if (!question) return;

      await toggleQuestionVisibilityApi(id, !question.is_hidden);

      // ローカル状態を更新
      setLocalQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q.question_id === id ? { ...q, is_hidden: !q.is_hidden } : q,
        ),
      );

      // 必要に応じてサーバーデータを再取得
      router.refresh();
    } catch (error) {
      console.error('質問の表示状態の切り替えに失敗:', error);
    }
  };

  // ページネーション計算
  const totalPages = Math.ceil(totalCount / itemsPerPage);

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
          <QuestionListHeader />

          {/* 検索・アクション部分 */}
          <QuestionListSearch
            searchQuery={initialSearchQuery}
            onSearch={handleSearch}
            sortBy={sortBy}
            setSortBy={handleSortByChange}
            filterType={filterType}
            setFilterType={handleFilterTypeChange}
            isAnsweredOnly={isAnsweredOnly}
            setIsAnsweredOnly={handleAnsweredOnlyChange}
            isVisibleOnly={isVisibleOnly}
            setIsVisibleOnly={handleVisibleOnlyChange}
            sortOrder={sortOrder}
            toggleSortOrder={handleSortOrderToggle}
            instructorOptions={instructors}
            selectedInstructor={selectedInstructor}
            setSelectedInstructor={handleInstructorChange}
          />

          {/* データ表示部分 */}
          <div
            className={css({
              opacity: isPending ? 0.5 : 1,
              pointerEvents: isPending ? 'none' : 'auto',
              transition: 'opacity 0.15s',
            })}
          >
            {/* テーブル部分 - デスクトップ表示 */}
            <QuestionListTable
              questions={questions}
              filterType={filterType}
              toggleVisibility={toggleVisibility}
            />

            {/* カード表示 - モバイル表示 */}
            <QuestionListCards
              questions={questions}
              filterType={filterType}
              toggleVisibility={toggleVisibility}
            />
          </div>

          {/* フッター部分 */}
          <QuestionListFooter
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </>
  );
};
