import { css } from '@/styled-system/css';

const Head = (props: React.HTMLProps<HTMLTableCellElement>) => (
  <th
    {...props}
    className={css({
      py: '3',
      px: '4',
      fontWeight: 'medium',
      color: 'gray.600',
    })}
  />
);

const Row = (props: React.HTMLProps<HTMLTableRowElement>) => (
  <tr
    {...props}
    className={css({
      borderBottom: '1px solid',
      borderColor: 'gray.200',
    })}
  />
);

const Cell = (props: React.HTMLProps<HTMLTableCellElement>) => (
  <td
    {...props}
    className={css({
      py: '3',
      px: '4',
    })}
  />
);

const Root = (props: React.HTMLProps<HTMLTableElement>) => (
  <table
    {...props}
    className={css({
      w: 'full',
      borderCollapse: 'collapse',
      textAlign: 'left',
    })}
  />
);

export { Root, Head, Row, Cell };
