'use client';

import { css } from '@/styled-system/css';
import Link from 'next/link';

export const EnqueteListHeader = () => {
  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: { base: '3', md: '4' },
        borderBottom: '1px solid',
        borderColor: 'gray.200',
        flexDirection: 'row',
        gap: '3',
      })}
    >
      <h1
        className={css({
          fontSize: { base: 'xl', md: '2xl' },
          fontWeight: 'bold',
          color: 'gray.800',
          textAlign: 'center',
          flex: '1',
        })}
      >
        アンケート一覧
      </h1>
      <div
        className={css({
          display: 'flex',
          gap: '3',
        })}
      >
        <Link
          href="/enquete/create"
          className={css({
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'medium',
            px: '4',
            py: '2',
            rounded: 'md',
            color: 'white',
            bg: 'blue.600',
            _hover: { bg: 'blue.700' },
            transition: 'all 0.2s',
          })}
        >
          <span className={css({ display: { base: 'none', md: 'inline' } })}>
            アンケート
          </span>
          作成
        </Link>
      </div>
    </div>
  );
};
