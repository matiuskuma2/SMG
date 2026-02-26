import { css } from '@/styled-system/css';
import type React from 'react';

const breadcrumb = css({
  display: 'flex',
  gap: '.5rem',
  fontSize: '12px',
  cursor: 'default',

  '& > li:not(:nth-child(1))': {
    _before: {
      content: '"/"',
      display: 'inline-block',
      pr: '.5rem',

      color: '#6c757d',
    },
  },
});

const Root = ({ children }: React.PropsWithChildren) => (
  <ul className={breadcrumb}>{children}</ul>
);

export const Item = ({ children }: React.PropsWithChildren) => {
  return <li>{children}</li>;
};

export const Breadcrumb = {
  Root,
  Item,
};
