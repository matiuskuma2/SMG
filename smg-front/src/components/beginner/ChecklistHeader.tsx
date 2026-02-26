import React from 'react';
import { css } from '@/styled-system/css';

export const ChecklistHeader: React.FC = () => {
  return (
    <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 })}>
      <div className={css({ display: 'flex', alignItems: 'center', gap: 2 })}>
        <span className={css({ fontWeight: 'bold' })}>済んだらチェック</span>
      </div>
    
    </div>
  );
}; 