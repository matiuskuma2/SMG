import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { css } from '@/styled-system/css';
import type React from 'react';
import { useState } from 'react';
import { FaDownload, FaSearch } from 'react-icons/fa';

interface SearchBarProps {
  searchQuery: string;
  filterRole: string;
  sortByJoinedDate: 'asc' | 'desc' | null;
  handleSearch: (query: string) => void;
  handleSortByJoinedDate: () => void;
  handleFilterRole: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  userTypes: string[];
  handleExportCSV?: () => void;
  isExporting?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  filterRole,
  sortByJoinedDate,
  handleSearch,
  handleSortByJoinedDate,
  handleFilterRole,
  userTypes,
  handleExportCSV,
  isExporting,
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
          flexDirection: { base: 'column', xl: 'row' },
          gap: { base: '3', xl: '4' },
          width: { base: 'full', xl: 'auto' },
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
              placeholder="ユーザーを検索"
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

        <Button
          onClick={handleSortByJoinedDate}
          className={css({
            px: '3',
            py: '2',
            rounded: 'md',
            border: '1px solid',
            borderColor: 'gray.300',
            bg: 'white',
            color: sortByJoinedDate ? 'blue.600' : 'gray.700',
            _hover: { bg: 'gray.50' },
            display: 'flex',
            alignItems: 'center',
            gap: '2',
            width: { base: 'full', xl: 'auto' },
          })}
        >
          入会日でソート
          {sortByJoinedDate === 'asc' && '↑'}
          {sortByJoinedDate === 'desc' && '↓'}
        </Button>

        <select
          className={css({
            px: '3',
            py: '2',
            rounded: 'md',
            border: '1px solid',
            borderColor: 'gray.300',
            bg: 'white',
            width: { base: 'full', xl: 'auto' },
          })}
          value={filterRole}
          onChange={handleFilterRole}
        >
          <option value="all">属性</option>
          {userTypes.map((type) => (
            <option key={type} value={type}>
              {type || '未設定'}
            </option>
          ))}
        </select>

        {handleExportCSV && (
          <Button
            onClick={handleExportCSV}
            disabled={isExporting}
            className={css({
              px: '3',
              py: '2',
              rounded: 'md',
              border: '1px solid',
              borderColor: 'gray.300',
              bg: 'white',
              color: 'gray.700',
              _hover: { bg: 'gray.50' },
              display: 'flex',
              alignItems: 'center',
              gap: '2',
              width: { base: 'full', xl: 'auto' },
              opacity: isExporting ? 0.6 : 1,
              cursor: isExporting ? 'not-allowed' : 'pointer',
            })}
          >
            <FaDownload size={14} />
            {isExporting ? 'エクスポート中...' : 'CSVダウンロード'}
          </Button>
        )}
      </div>
    </div>
  );
};
