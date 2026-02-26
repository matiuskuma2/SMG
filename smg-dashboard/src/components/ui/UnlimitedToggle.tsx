import { css } from '@/styled-system/css';

type UnlimitedToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export const UnlimitedToggle = ({
  checked,
  onChange,
  disabled = false,
}: UnlimitedToggleProps) => {
  return (
    <div
      className={css({
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2',
      })}
    >
      <span
        className={css({
          fontSize: 'sm',
          fontWeight: 'medium',
          color: disabled ? 'gray.400' : checked ? 'blue.600' : 'gray.700',
        })}
      >
        無期限
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label="無期限"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={css({
          position: 'relative',
          width: '44px',
          height: '24px',
          borderRadius: 'full',
          transition: 'background-color 0.2s',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          border: '2px solid',
          borderColor: checked ? 'blue.500' : 'gray.300',
          backgroundColor: checked ? 'blue.500' : 'gray.200',
          opacity: disabled ? 0.5 : 1,
          _focus: {
            boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.5)',
          },
        })}
      >
        <span
          className={css({
            position: 'absolute',
            top: '1px',
            left: checked ? '22px' : '2px',
            width: '18px',
            height: '18px',
            borderRadius: 'full',
            backgroundColor: 'white',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          })}
        />
      </button>
    </div>
  );
};
