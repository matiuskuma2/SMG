import { Pagination } from '@/components/ui/Pagination';
import { css } from '@/styled-system/css';
import type React from 'react';

interface EventListFooterProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const EventListFooter: React.FC<EventListFooterProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        p: { base: '3', xl: '4' },
        borderTop: '1px solid',
        borderColor: 'gray.200',
        flexDirection: { base: 'column', xl: 'row' },
        gap: { base: '3', xl: '0' },
      })}
    >
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
};
