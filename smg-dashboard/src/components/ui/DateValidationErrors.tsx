/**
 * 日付整合性チェックのエラー表示コンポーネント
 */

import { css } from '@/styled-system/css';
import type { DateValidationError } from '@/utils/dateValidation';

type DateValidationErrorsProps = {
  /** エラー配列 */
  errors: DateValidationError[];
  /** 表示するエラーのフィールド名（指定しない場合は全エラー表示） */
  field?: string;
  /** コンパクト表示（単一エラーのみ表示）*/
  compact?: boolean;
};

/**
 * 日付バリデーションエラーを表示するコンポーネント
 *
 * @example
 * ```tsx
 * // 全エラー表示
 * <DateValidationErrors errors={errors} />
 *
 * // 特定フィールドのエラーのみ表示
 * <DateValidationErrors errors={errors} field="applicationStart" />
 *
 * // コンパクト表示（インライン）
 * <DateValidationErrors errors={errors} field="eventStart" compact />
 * ```
 */
export const DateValidationErrors = ({
  errors,
  field,
  compact = false,
}: DateValidationErrorsProps) => {
  const filteredErrors = field
    ? errors.filter((e) => e.field === field)
    : errors;

  if (filteredErrors.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <span
        className={css({
          color: 'red.600',
          fontSize: 'sm',
          display: 'block',
          mt: '1',
        })}
      >
        {filteredErrors[0].message}
      </span>
    );
  }

  return (
    <div
      className={css({
        bg: 'red.50',
        border: '1px solid',
        borderColor: 'red.200',
        borderRadius: 'md',
        p: '3',
        mb: '4',
      })}
    >
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '2',
          mb: filteredErrors.length > 1 ? '2' : '0',
        })}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={css({
            width: '5',
            height: '5',
            color: 'red.500',
            flexShrink: 0,
          })}
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span
          className={css({
            color: 'red.700',
            fontWeight: 'medium',
            fontSize: 'sm',
          })}
        >
          日付の整合性エラー
        </span>
      </div>
      {filteredErrors.length === 1 ? (
        <p className={css({ color: 'red.600', fontSize: 'sm', ml: '7' })}>
          {filteredErrors[0].message}
        </p>
      ) : (
        <ul className={css({ color: 'red.600', fontSize: 'sm', ml: '7' })}>
          {filteredErrors.map((error, index) => (
            <li key={`${error.field}-${index}`} className={css({ mb: '1' })}>
              • {error.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/**
 * フィールド単位のインラインエラー表示コンポーネント
 */
type FieldErrorProps = {
  /** エラー配列 */
  errors: DateValidationError[];
  /** フィールド名 */
  field: string;
};

export const FieldDateError = ({ errors, field }: FieldErrorProps) => {
  const fieldErrors = errors.filter((e) => e.field === field);

  if (fieldErrors.length === 0) {
    return null;
  }

  return (
    <span
      className={css({
        color: 'red.600',
        fontSize: 'sm',
        display: 'block',
        mt: '1',
      })}
    >
      {fieldErrors[0].message}
    </span>
  );
};
