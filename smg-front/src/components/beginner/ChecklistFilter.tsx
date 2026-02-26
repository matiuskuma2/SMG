import React from 'react';
import { css } from '@/styled-system/css';

type ChecklistFilterProps = {
  showUncompletedOnly: boolean;
  setShowUncompletedOnly: (value: boolean) => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (value: boolean) => void;
};

export const ChecklistFilter: React.FC<ChecklistFilterProps> = ({
  showUncompletedOnly,
  setShowUncompletedOnly,
  showFavoritesOnly,
  setShowFavoritesOnly
}) => {
  return (
    <div className={css({ display: 'flex', gap: 4, mb: 4 })}>
      <label className={css({ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' })}>
        <input 
          type="checkbox" 
          checked={showUncompletedOnly}
          onChange={() => setShowUncompletedOnly(!showUncompletedOnly)}
          className={css({ 
            w: 4, 
            h: 4, 
            accentColor: 'blue.500',
          })}
        />
        <span>未完了のみ表示</span>
      </label>
  
    </div>
  );
}; 