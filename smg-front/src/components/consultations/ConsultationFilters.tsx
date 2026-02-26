import { css } from '@/styled-system/css';
import React from 'react';

type ConsultationFiltersProps = {
  instructors: string[];
  selectedInstructor: string;
  sortOrder: string;
  onInstructorChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onSortChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
};

export const ConsultationFilters = ({
  instructors,
  selectedInstructor,
  sortOrder,
  onInstructorChange,
  onSortChange,
}: ConsultationFiltersProps) => {
  return (
    <div className={css({
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.0rem',
      flexWrap: 'nowrap',
      justifyContent: 'flex-end',
      '@media (max-width: 640px)': {
        flexDirection: 'row',
        gap: '0.5rem',
      },
    })}>
      <div className={css({
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      })}>
        <select
          id="instructor-filter"
          value={selectedInstructor}
          onChange={onInstructorChange}
          className={css({
            padding: '0.5rem',
            borderRadius: '0.375rem',
            border: '1px solid',
            borderColor: 'gray.300',
            minWidth: '150px',
            backgroundColor: 'white',
          })}
        >
          <option value="">すべて表示（講師）</option>
          {instructors.map(instructor => (
            <option key={instructor} value={instructor}>
              {instructor}
            </option>
          ))}
        </select>
      </div>
      
      <div className={css({
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      })}>
        <select
          id="sort-order"
          value={sortOrder}
          onChange={onSortChange}
          className={css({
            padding: '0.5rem',
            borderRadius: '0.375rem',
            border: '1px solid',
            borderColor: 'gray.300',
            minWidth: '150px',
            backgroundColor: 'white',
          })}
        >
          <option value="asc">古い順</option>
          <option value="desc">新しい順</option>
        </select>
      </div>
    </div>
  );
}; 