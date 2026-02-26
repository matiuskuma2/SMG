import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { css } from '@/styled-system/css';
import type React from 'react';
import { FaSearch, FaSort } from 'react-icons/fa';

interface ParticipantsListSearchProps {
  searchQuery: string;
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  setSortBy: (value: string) => void;
  toggleSortOrder: () => void;
}

export const ParticipantsListSearch: React.FC<ParticipantsListSearchProps> = ({
  searchQuery,
  handleSearch,
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
          placeholder="個別相談を検索"
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
            <option value="candidateStartDateTime">申込期限でソート</option>
            <option value="applicants">申込人数でソート</option>
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
