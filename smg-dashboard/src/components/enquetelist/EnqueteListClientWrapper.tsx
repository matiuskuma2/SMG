'use client';

import { Suspense } from 'react';
import { EnqueteListClient } from './EnqueteListClient';

export default function EnqueteListClientWrapper() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <EnqueteListClient />
    </Suspense>
  );
}
