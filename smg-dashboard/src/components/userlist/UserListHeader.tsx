import { Button } from '@/components/ui/button';
import { css } from '@/styled-system/css';
import type React from 'react';

export const UserListHeader: React.FC<{ handleCreateUser: () => void }> = ({
  handleCreateUser,
}) => {
  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'gray.200',
        p: { base: '3', md: '4' },
        flexWrap: { base: 'wrap', md: 'nowrap' },
        gap: { base: '2', md: '0' },
        position: 'relative',
      })}
    >
      <h1
        className={css({
          fontSize: { base: 'lg', md: 'xl' },
          fontWeight: 'bold',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
        })}
      >
        ユーザー一覧
      </h1>
      <Button
        onClick={handleCreateUser}
        className={css({
          bg: 'blue.600',
          color: 'white',
          _hover: { bg: 'blue.700' },
          px: { base: '3', md: '6' },
          py: { base: '2', md: '3' },
          rounded: 'md',
          fontSize: { base: 'sm', md: 'md' },
          fontWeight: 'medium',
          ml: 'auto',
          width: { base: '80px', md: '200px' },
        })}
      >
        <span className={css({ display: { base: 'none', md: 'inline' } })}>
          新規ユーザー
        </span>
        登録
      </Button>
    </div>
  );
};
