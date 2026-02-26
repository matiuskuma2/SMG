import { Breadcrumb } from '@/features/root/components/breadcrumb';
import { css } from '@/styled-system/css';
import React from 'react';

const Page = () => {
  return (
    <>
      <div
        className={css({
          bg: 'white',
          px: '1rem',
          py: '.75rem',
          cursor: 'default',
        })}
      >
        <Breadcrumb.Root>
          <Breadcrumb.Item>投稿</Breadcrumb.Item>
          <Breadcrumb.Item>一覧</Breadcrumb.Item>
        </Breadcrumb.Root>
      </div>
      <div>content</div>
    </>
  );
};

export default Page;
