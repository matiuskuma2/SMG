import { css, cva } from '@/styled-system/css';

export const btnStyle = cva({
  base: {
    padding: '0.5rem',
    margin: '0.25rem',
    color: 'white',
    borderRadius: '0.25rem',
    display: 'inline-flex',
    alignItems: 'center',
  },
  variants: {
    type: {
      primary: {
        backgroundColor: 'blue.500',
      },
      danger: {
        backgroundColor: 'red.500',
      },
      text: {
        color: 'blue.500',
        padding: '0',
        margin: '0',
      },
    },
  },
  defaultVariants: {
    type: 'primary',
  },
});

export const inputStyle = css({
  width: '100%',
  padding: '0.5rem',
  borderRadius: '0.25rem',
  border: '1px solid',
  borderColor: 'gray.300',
});
