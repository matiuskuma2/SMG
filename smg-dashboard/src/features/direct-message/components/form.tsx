import { css } from '@/styled-system/css';
import { styled } from '@/styled-system/jsx';

export const Label = ({
  htmlFor,
  children,
  required,
  ...rest
}: React.HTMLProps<HTMLLabelElement>) => (
  <label {...rest} className={css({ d: 'block', mb: '0.5' })} htmlFor={htmlFor}>
    {children}
    {required && (
      <span className={css({ color: 'red.500', ml: '4' })}>必須</span>
    )}
  </label>
);

export const Input = styled('input', {
  base: {
    width: 'full',
    padding: '8px',
    borderRadius: 'sm',
    outline: '1.5px solid',
    py: '2',
    px: '2',
    outlineColor: {
      base: 'gray.300',
      _active: 'blue.500',
      _focusVisible: 'blue.500',
    },
  },
});
