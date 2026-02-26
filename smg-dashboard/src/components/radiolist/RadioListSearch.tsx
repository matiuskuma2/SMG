import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { css } from '@/styled-system/css';
import type React from 'react';
import { useState } from 'react';
import { FaSearch, FaSort } from 'react-icons/fa';

interface RadioListSearchProps {
  searchQuery: string;
  handleSearch: (query: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  setSortBy: (value: string) => void;
  toggleSortOrder: () => void;
}

export const RadioListSearch: React.FC<RadioListSearchProps> = ({
  searchQuery,
  handleSearch,
  sortBy,
  sortOrder,
  setSortBy,
  toggleSortOrder,
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const onSearchClick = () => {
    handleSearch(localSearchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchClick();
    }
  };

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
          display: 'flex',
          gap: '2',
          width: { base: 'full', xl: 'auto' },
        })}
      >
        <div
          className={css({
            position: 'relative',
            width: { base: 'full', xl: '300px' },
          })}
        >
          <Input
            placeholder="ラジオを検索"
            className={css({
              pr: '10',
              pl: '4',
              py: '2',
              rounded: 'md',
              width: 'full',
            })}
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
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
        <Button
          className={css({
            px: '4',
            py: '2',
            bg: 'blue.500',
            color: 'white',
            rounded: 'md',
            _hover: { bg: 'blue.600' },
            flexShrink: 0,
          })}
          onClick={onSearchClick}
        >
          検索
        </Button>
      </div>

      {/* ソートのドロップダウン */}
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
          <option value="created_at">作成日でソート</option>
          <option value="radio_name">名前でソート</option>
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
  );
};
