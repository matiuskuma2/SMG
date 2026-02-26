import { css } from '@/styled-system/css';
import type { FC } from 'react';

export type SelectOption = {
  id: string;
  name: string;
};

type SelectFieldProps = {
  name: string;
  label?: string;
  value?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

export const SelectField: FC<SelectFieldProps> = ({
  name,
  label,
  value,
  required = false,
  options,
  placeholder = '選択してください',
  onChange,
}) => (
  <div className={css({ mb: '4' })}>
    {label && (
      <label
        htmlFor={name}
        className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
      >
        {label}{' '}
        {required && <span className={css({ color: 'red.500' })}>*</span>}
      </label>
    )}
    <select
      id={name}
      name={name}
      value={value ?? ''}
      required={required}
      className={css({
        border: '1px solid',
        borderColor: 'gray.300',
        p: '2',
        borderRadius: 'md',
        width: '100%',
        outline: 'none',
        bg: 'white',
        _focus: { borderColor: 'blue.500' },
      })}
      onChange={onChange}
    >
      <option key={`${name}-placeholder`} value="" disabled>
        {placeholder}
      </option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id} data-id={opt.id}>
          {opt.name}
        </option>
      ))}
    </select>
  </div>
);
