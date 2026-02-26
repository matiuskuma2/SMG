import { css } from '@/styled-system/css';
import { Grid } from '@/styled-system/jsx';

export const Header = (props: React.PropsWithChildren) => (
  <div
    className={css({
      bg: 'white',
      px: '1rem',
      py: '.75rem',
      cursor: 'default',
    })}
  >
    {props.children}
  </div>
);

export const Main = (props: React.PropsWithChildren) => (
  <div className={css({ p: '8', h: 'full' })}>{props.children}</div>
);

export const Container = (props: React.PropsWithChildren) => (
  <Grid
    gridTemplateRows={'auto 1fr'}
    h={'full'}
    maxH={'100vh'}
    rowGap={'0'}
    overflowX={'auto'}
  >
    {props.children}
  </Grid>
);
