import { css } from '../../../styled-system/css';
import Link from 'next/link';

type ListPaginationProps = {
  currentPage: number;
  totalPages: number;
  basePath?: string;  // 例: '/events' or '/bookkeeping'
  onPageChange?: (page: number) => void;
}

export const ListPagination = ({ currentPage, totalPages, basePath, onPageChange }: ListPaginationProps) => {
  // ベースパスから末尾のスラッシュを削除
  const normalizedBasePath = basePath ? (basePath.endsWith('/') ? basePath.slice(0, -1) : basePath) : '';

  // 表示するページ番号の配列を生成
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5; // 表示する最大ページ数（最初と最後を含む）

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

    // 最後のページを追加（最初のページと異なる場合）
    if (totalPages !== 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  // ページリンクのURLを生成（フィルター状態を保持）
  const getPageUrl = (page: number) => {
    const currentSearchParams = new URLSearchParams(window.location.search);

    if (page === 1) {
      currentSearchParams.delete('page');
    } else {
      currentSearchParams.set('page', page.toString());
    }

    const queryString = currentSearchParams.toString();
    return queryString ? `${normalizedBasePath}?${queryString}` : normalizedBasePath;
  };

  // ページ変更ハンドラー
  const handlePageClick = (page: number, e: React.MouseEvent) => {
    if (onPageChange) {
      e.preventDefault();
      onPageChange(page);
    }
  };

  // basePath有無でリンクかボタンかを切り替えるヘルパー
  const renderPageLink = (page: number, children: React.ReactNode): React.ReactElement => {
    if (basePath) {
      return (
        <Link href={getPageUrl(page)} onClick={(e) => handlePageClick(page, e)}>
          {children}
        </Link>
      );
    }
    return (
      <button type="button" onClick={() => onPageChange?.(page)}>
        {children}
      </button>
    );
  };

  const navButtonStyle = css({
    px: 3,
    py: 2,
    borderRadius: 'md',
    bg: 'gray.200',
    color: 'gray.800',
    fontWeight: 'medium',
    cursor: 'pointer',
    _hover: {
      bg: 'gray.300'
    },
    '@media (min-width: 640px)': {
      px: 4
    }
  });

  const disabledNavButtonStyle = css({
    px: 3,
    py: 2,
    borderRadius: 'md',
    bg: 'gray.200',
    color: 'gray.400',
    fontWeight: 'medium',
    cursor: 'not-allowed',
    '@media (min-width: 640px)': {
      px: 4
    }
  });

  return (
    <div className={css({
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      mt: 8,
      mb: 8,
      gap: 2,
      '@media (min-width: 640px)': {
        gap: 4
      }
    })}>
      {/* 前のページへのリンク */}
      {currentPage === 1 ? (
        <span className={disabledNavButtonStyle}>
           &lt;
        </span>
      ) : (
        renderPageLink(currentPage - 1, (
          <span className={navButtonStyle}>
             &lt;
          </span>
        ))
      )}

      {/* ページ番号リンク */}
      {getPageNumbers().map((pageNum, index, array) => {
        // ページ番号の間に省略記号を挿入
        const showEllipsis = index < array.length - 1 && array[index + 1] - pageNum > 1;

        return (
          <div key={pageNum} className={css({ display: 'flex', alignItems: 'center' })}>
            {renderPageLink(pageNum, (
              <span className={css({
                px: 3,
                py: 2,
                borderRadius: 'md',
                bg: pageNum === currentPage ? 'gray.600' : 'gray.200',
                color: pageNum === currentPage ? 'white' : 'gray.800',
                fontWeight: pageNum === currentPage ? 'bold' : 'medium',
                cursor: 'pointer',
                _hover: {
                  bg: pageNum === currentPage ? 'gray.600' : 'gray.300'
                },
                '@media (min-width: 640px)': {
                  px: 4
                }
              })}>{pageNum}</span>
            ))}
            {showEllipsis && (
              <span className={css({ mx: 2, color: 'gray.500' })}>...</span>
            )}
          </div>
        );
      })}

      {/* 次のページへのリンク */}
      {currentPage >= totalPages ? (
        <span className={disabledNavButtonStyle}>
          &gt;
        </span>
      ) : (
        renderPageLink(currentPage + 1, (
          <span className={navButtonStyle}>
            &gt;
          </span>
        ))
      )}
    </div>
  );
};
