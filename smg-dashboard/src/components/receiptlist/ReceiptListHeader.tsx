import { Button } from '@/components/ui/button';
import { css } from '@/styled-system/css';
import type React from 'react';
import { FaPlus } from 'react-icons/fa';
import { ReceiptListSearch } from './ReceiptListSearch';

interface ReceiptListHeaderProps {
  handleCreateReceipt: () => void;
  filterSource: string;
  handleFilterSource: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  searchQuery: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  executeSearch: () => void;
}

export const ReceiptListHeader: React.FC<ReceiptListHeaderProps> = ({
  handleCreateReceipt,
  filterSource,
  handleFilterSource,
  searchQuery,
  handleInputChange,
  executeSearch,
}) => {
  return (
    <div
      className={css({
        borderBottom: '1px solid',
        borderColor: 'gray.200',
        p: { base: '3', xl: '4' },
      })}
    >
      {/* タイトル行 */}
      <div
        className={css({
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          mb: { base: '3', xl: '4' },
        })}
      >
        <h1
          className={css({
            fontSize: { base: 'lg', xl: 'xl' },
            fontWeight: 'bold',
          })}
        >
          領収書
        </h1>

        {/* 発行ボタン */}
        <div
          className={css({
            position: 'absolute',
            right: { base: '0', xl: '0' },
          })}
        >
          <Button
            className={css({
              display: 'flex',
              alignItems: 'center',
              gap: '2',
              bg: 'blue.600',
              color: 'white',
              _hover: { bg: 'blue.700' },
              px: { base: '3', xl: '4' },
              py: { base: '1.5', xl: '2' },
              rounded: 'md',
              fontSize: { base: 'sm', xl: 'md' },
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            })}
            onClick={handleCreateReceipt}
          >
            <FaPlus
              size={14}
              className={css({ display: { base: 'none', xl: 'block' } })}
            />
            <span className={css({ display: { base: 'none', xl: 'inline' } })}>
              領収書の発行
            </span>
            <span className={css({ display: { base: 'inline', xl: 'none' } })}>
              発行
            </span>
          </Button>
        </div>
      </div>

      {/* 検索バーとフィルタ */}
      <div
        className={css({
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '3',
        })}
      >
        <ReceiptListSearch
          searchQuery={searchQuery}
          handleInputChange={handleInputChange}
          executeSearch={executeSearch}
        />
        <select
          className={css({
            px: '3',
            py: '2',
            rounded: 'md',
            border: '1px solid',
            borderColor: 'gray.300',
            bg: 'white',
            cursor: 'pointer',
            fontSize: { base: 'sm', xl: 'md' },
          })}
          value={filterSource}
          onChange={handleFilterSource}
        >
          <option value="all">すべて</option>
          <option value="dashboard">管理者</option>
          <option value="member">会員</option>
        </select>
      </div>
    </div>
  );
};
