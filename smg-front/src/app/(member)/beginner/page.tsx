'use client';

import React from 'react';
import { css } from '@/styled-system/css';
import { BeginnerChecklist } from '@/components/beginner';
import Banner from '@/components/events/Banner';

export default function BeginnerPage() {
  return (
    <>
      <div className={css({
        maxW: '7xl',
        mx: 'auto',
        px: '4',
        '@media (min-width: 768px)': { px: '8' },
      })}>
        <Banner />
      </div>
      <div className={css({
        minH: '100vh',
        p: 4,
        maxW: '800px',
        mx: 'auto'
      })}>
        <BeginnerChecklist />
      </div>
    </>
  );
}
