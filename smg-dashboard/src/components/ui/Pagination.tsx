'use client';

import { css } from '@/styled-system/css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  // 表示するページ番号の配列を生成
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    // totalPagesが1以下の場合は1ページ目のみ
    if (totalPages <= 1) {
      return [1];
    }

    // 常に最初のページを追加
    pages.push(1);

    // 現在のページの前後のページを計算
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    // 最初のページと最後のページの間に十分なページがある場合
    if (totalPages > maxVisiblePages) {
      if (currentPage <= 3) {
        endPage = 4;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
      }
    }

    // 現在のページの前後のページを追加
    for (let i = startPage; i <= endPage; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    // 最後のページを追加
    pages.push(totalPages);

    return pages;
  };

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div
      className={css({
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        mt: 8,
        mb: 8,
        gap: 2,
        '@media (min-width: 640px)': {
          gap: 4,
        },
      })}
    >
      {/* 前のページへのボタン */}
      <button
        type="button"
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className={css({
          px: 3,
          py: 2,
          borderRadius: 'md',
          bg: 'gray.200',
          color: currentPage === 1 ? 'gray.400' : 'gray.800',
          fontWeight: 'medium',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          _hover: {
            bg: currentPage === 1 ? 'gray.200' : 'gray.300',
          },
          '@media (min-width: 640px)': {
            px: 4,
          },
        })}
      >
        <ChevronLeft size={16} />
      </button>

      {/* ページ番号 */}
      {getPageNumbers().map((pageNum, index, array) => {
        const showEllipsis =
          index < array.length - 1 && array[index + 1] - pageNum > 1;

        return (
          <div
            key={pageNum}
            className={css({ display: 'flex', alignItems: 'center' })}
          >
            <button
              type="button"
              onClick={() => handlePageClick(pageNum)}
              className={css({
                px: 3,
                py: 2,
                borderRadius: 'md',
                bg: pageNum === currentPage ? 'gray.600' : 'gray.200',
                color: pageNum === currentPage ? 'white' : 'gray.800',
                fontWeight: pageNum === currentPage ? 'bold' : 'medium',
                cursor: 'pointer',
                _hover: {
                  bg: pageNum === currentPage ? 'gray.600' : 'gray.300',
                },
                '@media (min-width: 640px)': {
                  px: 4,
                },
              })}
            >
              {pageNum}
            </button>
            {showEllipsis && (
              <span className={css({ mx: 2, color: 'gray.500' })}>...</span>
            )}
          </div>
        );
      })}

      {/* 次のページへのボタン */}
      <button
        type="button"
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={css({
          px: 3,
          py: 2,
          borderRadius: 'md',
          bg: 'gray.200',
          color: currentPage >= totalPages ? 'gray.400' : 'gray.800',
          fontWeight: 'medium',
          cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
          _hover: {
            bg: currentPage >= totalPages ? 'gray.200' : 'gray.300',
          },
          '@media (min-width: 640px)': {
            px: 4,
          },
        })}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
