import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { css } from '@/styled-system/css';
import type React from 'react';
import { FaSearch, FaSort } from 'react-icons/fa';

interface EventListSearchProps {
  searchQuery: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  executeSearch: () => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filterLevel: string;
  setSortBy: (value: string) => void;
  toggleSortOrder: () => void;
  handleFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  eventTypesOrder: string[];
}

export const EventListSearch: React.FC<EventListSearchProps> = ({
  searchQuery,
  handleInputChange,
  executeSearch,
  sortBy,
  sortOrder,
  filterLevel,
  setSortBy,
  toggleSortOrder,
  handleFilterChange,
  eventTypesOrder,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
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
      <form
        onSubmit={handleSubmit}
        className={css({
          display: 'flex',
          gap: '2',
          width: { base: 'full', xl: '300px' },
        })}
      >
        <div
          className={css({
            position: 'relative',
            flex: 1,
          })}
        >
          <Input
            placeholder="イベントを検索"
            className={css({
              pr: '10',
              pl: '4',
              py: '2',
              rounded: 'md',
              width: 'full',
            })}
            value={searchQuery}
            onChange={handleInputChange}
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
          type="submit"
          className={css({
            px: '4',
            py: '2',
            bg: 'blue.600',
            color: 'white',
            rounded: 'md',
            _hover: { bg: 'blue.700' },
            flexShrink: 0,
          })}
        >
          検索
        </Button>
      </form>

      {/* ソートとフィルタのドロップダウン */}
      <div
        className={css({
          display: 'flex',
          gap: '2',
          width: { base: 'full', xl: 'auto' },
          flexDirection: { base: 'column', xl: 'row' },
        })}
      >
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
            <option value="createdDate">作成日でソート</option>
            <option value="eventDate">開催日でソート</option>
            <option value="applicants">申込者数でソート</option>
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
          value={filterLevel}
          onChange={handleFilterChange}
        >
          <option value="all">すべての区分</option>
          {eventTypesOrder.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
