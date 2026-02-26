'use client';

import { css } from '@/styled-system/css';
import { ArrowUpDown } from 'lucide-react';
import type React from 'react';

interface SearchBarProps {
  sortBy: 'eventDate' | 'responseDeadline' | null;
  sortOrder: 'asc' | 'desc';
  handleSort: (field: 'eventDate' | 'responseDeadline') => void;
}

export const SearchBar = ({
  sortBy,
  sortOrder,
  handleSort,
}: SearchBarProps) => {
  return (
    <div
      className={css({
        display: 'flex',
        flexDirection: { base: 'column', md: 'row' },
        alignItems: { md: 'center' },
        justifyContent: { base: 'center', md: 'flex-end' },
        gap: '3',
        p: { base: '3', md: '4' },
        borderBottom: '1px solid',
        borderColor: 'gray.200',
      })}
    >
      {/* ソートボタン */}
      <div
        className={css({
          display: 'flex',
          gap: '2',
        })}
      >
        <button
          type="button"
          onClick={() => handleSort('eventDate')}
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '1',
            px: '3',
            py: '2',
            border: '1px solid',
            borderColor: 'gray.300',
            rounded: 'md',
            bg: sortBy === 'eventDate' ? 'blue.50' : 'white',
            color: sortBy === 'eventDate' ? 'blue.600' : 'gray.700',
            _hover: {
              bg: 'gray.50',
            },
          })}
        >
          <span>開催日</span>
          <ArrowUpDown size={16} />
        </button>
        <button
          type="button"
          onClick={() => handleSort('responseDeadline')}
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '1',
            px: '3',
            py: '2',
            border: '1px solid',
            borderColor: 'gray.300',
            rounded: 'md',
            bg: sortBy === 'responseDeadline' ? 'blue.50' : 'white',
            color: sortBy === 'responseDeadline' ? 'blue.600' : 'gray.700',
            _hover: {
              bg: 'gray.50',
            },
          })}
        >
          <span>回答期限</span>
          <ArrowUpDown size={16} />
        </button>
      </div>
    </div>
  );
};
