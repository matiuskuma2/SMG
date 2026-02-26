import { Input } from '@/components/ui/input';
import { css } from '@/styled-system/css';
import type React from 'react';
import { useState } from 'react';
import { FaSearch, FaSort } from 'react-icons/fa';
import { Button } from '../ui/button';
import type { FilterType, SortKey } from './QuestionTypes';

const selectStyle = css({
  px: '3',
  py: '2',
  rounded: 'md',
  border: '1px solid',
  borderColor: 'gray.300',
  bg: 'white',
  _focus: { outline: 'none', borderColor: 'blue.500' },
  width: { base: 'full', xl: 'auto' },
});

interface QuestionListSearchProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  sortBy: string;
  setSortBy: (value: SortKey) => void;
  filterType: FilterType;
  setFilterType: (type: FilterType) => void;
  isAnsweredOnly: boolean;
  setIsAnsweredOnly: (value: boolean) => void;
  isVisibleOnly: boolean;
  setIsVisibleOnly: (value: boolean) => void;
  sortOrder: 'asc' | 'desc';
  toggleSortOrder: () => void;
  selectedInstructor: string;
  setSelectedInstructor: (value: string) => void;
  instructorOptions: { id: string; name: string }[];
}

export const QuestionListSearch: React.FC<QuestionListSearchProps> = ({
  searchQuery,
  onSearch,
  sortBy,
  setSortBy,
  filterType,
  setFilterType,
  isAnsweredOnly,
  setIsAnsweredOnly,
  isVisibleOnly,
  setIsVisibleOnly,
  sortOrder,
  toggleSortOrder,
  selectedInstructor,
  setSelectedInstructor,
  instructorOptions,
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const onSearchClick = () => {
    onSearch(localSearchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchClick();
    }
  };
  const filterOptions: { label: string; value: FilterType }[] = [
    { label: '公開', value: 'public' },
    { label: '非公開', value: 'anonymous' },
  ];
  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: { base: 'wrap', xl: 'nowrap' },
        gap: '4',
        px: '4',
        pt: '4',
        mb: '4',
      })}
    >
      {/* 公開/匿名のフィルター */}
      <div className={css({ display: 'flex' })}>
        {filterOptions.map(({ label, value }, index) => {
          const isActive = filterType === value;
          return (
            <Button
              type="button"
              key={value}
              onClick={() => setFilterType(value)}
              className={css({
                px: '4',
                py: '1.5',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                borderRadius:
                  index === 0
                    ? '10px 0 0 10px'
                    : index === filterOptions.length - 1
                      ? '0 10px 10px 0'
                      : '0',
                bg: isActive ? 'blue.500' : 'gray.200',
                color: isActive ? 'white' : 'gray.700',
                _hover: {
                  bg: isActive ? 'blue.600' : 'gray.300',
                },
                border: '1px solid',
                borderLeft: index === 0 ? '1px solid' : 'none',
                borderColor: isActive ? 'blue.600' : 'gray.300',
                boxShadow: isActive ? 'md' : 'none',
              })}
            >
              {label}
            </Button>
          );
        })}
      </div>

      {/* 検索・ソート */}
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '4',
          flexDirection: { base: 'column', xl: 'row' },
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
              placeholder="質問を検索"
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

        <div
          className={css({
            display: 'flex',
            gap: '2',
            width: { base: 'full', xl: 'auto' },
            flexDirection: { base: 'column', xl: 'row' },
          })}
        >
          {/* sortBy */}
          <select
            className={selectStyle}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
          >
            <option value="questionDate">質問日</option>
            <option value="answerDate">回答日</option>
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

          <select
            className={selectStyle}
            value={selectedInstructor}
            onChange={(e) => setSelectedInstructor(e.target.value)}
          >
            <option value="">全ての講師</option>
            {instructorOptions.map((name) => (
              <option key={name.id} value={name.id}>
                {name.name}
              </option>
            ))}
          </select>

          <label
            className={css({
              display: 'flex',
              alignItems: 'center',
              gap: '1',
              cursor: 'pointer',
              fontSize: 'sm',
            })}
          >
            <input
              type="checkbox"
              checked={isAnsweredOnly}
              onChange={(e) => setIsAnsweredOnly(e.target.checked)}
            />
            回答済みのみ
          </label>

          <label
            className={css({
              display: 'flex',
              alignItems: 'center',
              gap: '1',
              cursor: filterType === 'anonymous' ? 'not-allowed' : 'pointer',
              fontSize: 'sm',
              opacity: filterType === 'anonymous' ? 0.5 : 1,
            })}
          >
            <input
              type="checkbox"
              checked={filterType === 'anonymous' ? false : isVisibleOnly}
              onChange={(e) => setIsVisibleOnly(e.target.checked)}
              disabled={filterType === 'anonymous'}
            />
            公開のみ
          </label>
        </div>
      </div>
    </div>
  );
};
