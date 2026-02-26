import * as React from 'react';
import { css } from '../../../styled-system/css';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={css({
          display: 'flex',
          height: '10',
          width: 'full',
          rounded: 'md',
          border: '1px solid black',
          bg: 'background',
          px: '3',
          py: '2',
          fontSize: {
            base: 'base',
            md: 'sm',
          },
          ringOffset: 'background',
          _file: {
            border: '0',
            bg: 'transparent',
            fontSize: 'sm',
            fontWeight: 'medium',
            color: 'foreground',
          },
          _placeholder: {
            color: 'muted.foreground',
          },
          _focusVisible: {
            outline: 'none',
            ring: '2',
            ringColor: 'ring',
            ringOffset: '2',
          },
          _disabled: {
            cursor: 'not-allowed',
            opacity: '50',
          },
        })}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
