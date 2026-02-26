import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { css } from '@/styled-system/css';
import type React from 'react';
import { useState } from 'react';
import { FaSearch, FaSort } from 'react-icons/fa';

interface ArchiveListSearchProps {
  searchQuery: string;
  handleSearch: (query: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  combinedFilter: string;
  archiveTypes: { [key: string]: string };
  setSortBy: (value: string) => void;
  toggleSortOrder: () => void;
  handleCombinedFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const ArchiveListSearch: React.FC<ArchiveListSearchProps> = ({
  searchQuery,
  handleSearch,
  sortBy,
  sortOrder,
  combinedFilter,
  archiveTypes,
  setSortBy,
  toggleSortOrder,
  handleCombinedFilterChange,
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
            placeholder="アーカイブを検索"
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
            <option value="publishDate">投稿日でソート</option>
            <option value="title">タイトルでソート</option>
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
              minWidth: '200px',
            })}
            value={combinedFilter}
            onChange={handleCombinedFilterChange}
          >
            <option value="all">すべての区分・タイプ</option>
            <option value="event_type:定例会">定例会</option>
            <option value="event_type:簿記講座">簿記講座</option>
            <option value="event_type:オンラインセミナー">
              オンラインセミナー
            </option>
            <option value="event_type:特別セミナー">特別セミナー</option>
            <option value="event_type:5大都市グループ相談会&交流会">
              グループ相談会
            </option>
            <option value="archive_type:写真">写真</option>
            <option value="archive_type:ニュースレター">ニュースレター</option>
          </select>
        </div>
      </div>
    </div>
  );
};
