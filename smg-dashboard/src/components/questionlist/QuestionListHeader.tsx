import { css } from '@/styled-system/css';
import type React from 'react';

export const QuestionListHeader: React.FC = () => {
  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'gray.200',
        p: { base: '3', xl: '4' },
        position: 'relative',
      })}
    >
      <h1
        className={css({
          fontSize: { base: 'lg', xl: 'xl' },
          fontWeight: 'bold',
        })}
      >
        質問一覧
      </h1>
    </div>
  );
};
