import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { css } from '@/styled-system/css';
import type React from 'react';
import { FaSearch, FaSort } from 'react-icons/fa';

import type { NoticeCategoryBasic } from '@/components/notice/types';

interface NoticeListSearchProps {
  searchQuery: string;
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedCategory: string;
  categories: NoticeCategoryBasic[];
  onCategoryChange: (categoryId: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  setSortBy: (value: string) => void;
  toggleSortOrder: () => void;
}

export const NoticeListSearch: React.FC<NoticeListSearchProps> = ({
  searchQuery,
  handleSearch,
  selectedCategory,
  categories,
  onCategoryChange,
  sortBy,
  sortOrder,
  setSortBy,
  toggleSortOrder,
}) => {
  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        p: { base: '3', xl: '4' },
        borderBottom: '1px solid',
        borderColor: 'gray.200',
        flexDirection: { base: 'column', xl: 'row' },
        gap: { base: '3', xl: '4' },
      })}
    >
      <div
        className={css({
          position: 'relative',
          width: { base: 'full', xl: '300px' },
        })}
      >
        <Input
          placeholder="お知らせを検索"
          className={css({
            pr: '10',
            pl: '4',
            py: '2',
            rounded: 'md',
            width: 'full',
          })}
          value={searchQuery}
          onChange={handleSearch}
        />
        <FaSearch
          className={css({
            position: 'absolute',
            right: '4',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'gray.400',
          })}
        />
      </div>

      {/* ソートとフィルタのドロップダウン */}
      <div
        className={css({
          display: 'flex',
          gap: '2',
          width: { base: 'full', xl: 'auto' },
          flexDirection: { base: 'column', xl: 'row' },
        })}
      >
        {/* カテゴリーフィルター */}
        <select
          className={css({
            px: '3',
            py: '2',
            rounded: 'md',
            border: '1px solid',
            borderColor: 'gray.300',
            bg: 'white',
            _focus: { outline: 'none', borderColor: 'blue.500' },
            width: { base: 'full', xl: 'auto' },
            minW: { xl: '150px' },
          })}
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="">すべてのカテゴリー</option>
          {categories.map((category) => (
            <option key={category.category_id} value={category.category_id}>
              {category.category_name}
            </option>
          ))}
        </select>

        <div
          className={css({
            display: 'flex',
            gap: '2',
            width: { base: 'full', xl: 'auto' },
          })}
        >
          <select
            className={css({
              px: '3',
              py: '2',
              rounded: 'md',
              border: '1px solid',
              borderColor: 'gray.300',
              bg: 'white',
              _focus: { outline: 'none', borderColor: 'blue.500' },
              width: { base: 'full', xl: 'auto' },
            })}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">作成日でソート</option>
            <option value="postPeriod">投稿期間でソート</option>
          </select>

          <Button
            className={css({
              display: 'flex',
              alignItems: 'center',
              gap: '1',
              bg: 'white',
              color: 'gray.700',
              borderColor: 'gray.300',
              _hover: { bg: 'gray.50' },
              width: { base: 'auto', xl: 'auto' },
              flexShrink: 0,
            })}
            onClick={toggleSortOrder}
          >
            <FaSort />
            {sortOrder === 'asc' ? '昇順' : '降順'}
          </Button>
        </div>
      </div>
    </div>
  );
};
