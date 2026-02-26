import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { css } from '@/styled-system/css';
import type React from 'react';
import { FaSearch } from 'react-icons/fa';

interface ReceiptListSearchProps {
  searchQuery: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  executeSearch: () => void;
}

export const ReceiptListSearch: React.FC<ReceiptListSearchProps> = ({
  searchQuery,
  handleInputChange,
  executeSearch,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={css({
        display: 'flex',
        gap: '2',
        width: { base: 'full', xl: '350px' },
      })}
    >
      <div
        className={css({
          position: 'relative',
          flex: 1,
        })}
      >
        <Input
          placeholder="発行者名、会社名、宛名で検索"
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
          cursor: 'pointer',
        })}
      >
        検索
      </Button>
    </form>
  );
};
