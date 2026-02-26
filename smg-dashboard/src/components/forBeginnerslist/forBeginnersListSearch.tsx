'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { css } from '@/styled-system/css';
import type React from 'react';
import { useEffect, useState } from 'react';
import { FaSearch, FaSort } from 'react-icons/fa';

interface ForBeginnersListSearchProps {
  searchQuery: string;
  handleSearch: (query: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  setSortBy: (value: 'date' | 'title') => void;
  toggleSortOrder: () => void;
}

export const ForBeginnersListSearch: React.FC<ForBeginnersListSearchProps> = ({
  searchQuery,
  handleSearch,
  sortBy,
  sortOrder,
  setSortBy,
  toggleSortOrder,
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleSearchClick = () => {
    handleSearch(localSearchQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(localSearchQuery);
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
            placeholder="キーワードを検索"
            className={css({
              pr: '10',
              pl: '4',
              py: '2',
              rounded: 'md',
              width: 'full',
            })}
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            onKeyPress={handleKeyDown}
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
          onClick={handleSearchClick}
        >
          検索
        </Button>
      </div>
    </div>
  );
};
