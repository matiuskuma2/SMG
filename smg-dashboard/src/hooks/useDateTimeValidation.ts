/**
 * 日付整合性チェック用のカスタムフック
 */

import {
  type ConsultationDateFields,
  type DateValidationError,
  type EventDateFields,
  type SimpleDateRangeFields,
  getAllErrorMessages,
  getFieldErrors,
  hasFieldError,
  validateConsultationDateSequence,
  validateEventDateSequence,
  validateSimpleDateRange,
} from '@/utils/dateValidation';
import { useCallback, useMemo, useRef, useState } from 'react';

/**
 * イベント用の日付バリデーションフックの戻り値型
 */
type UseEventDateValidationReturn = {
  /** 現在のエラー一覧 */
  errors: DateValidationError[];
  /** エラーがあるかどうか */
  hasErrors: boolean;
  /** 日付フィールドの値を更新してバリデーション実行 */
  updateField: (field: keyof EventDateFields, value: string) => void;
  /** すべてのフィールドを一括更新してバリデーション実行 */
  updateAllFields: (fields: EventDateFields) => void;
  /** 手動でバリデーションを実行 */
  validate: (fields?: EventDateFields) => DateValidationError[];
  /** 特定フィールドにエラーがあるかチェック */
  hasFieldError: (field: string) => boolean;
  /** 特定フィールドのエラーメッセージを取得 */
  getFieldErrors: (field: string) => string[];
  /** すべてのエラーメッセージを取得 */
  getAllErrorMessages: () => string[];
  /** エラーをクリア */
  clearErrors: () => void;
  /** 現在のフィールド値 */
  fields: EventDateFields;
};

/**
 * シンプルな日付範囲バリデーションフックの戻り値型
 */
type UseSimpleDateValidationReturn = {
  /** 現在のエラー一覧 */
  errors: DateValidationError[];
  /** エラーがあるかどうか */
  hasErrors: boolean;
  /** 日付フィールドの値を更新してバリデーション実行 */
  updateField: (field: keyof SimpleDateRangeFields, value: string) => void;
  /** すべてのフィールドを一括更新してバリデーション実行 */
  updateAllFields: (fields: SimpleDateRangeFields) => void;
  /** 手動でバリデーションを実行 */
  validate: (fields?: SimpleDateRangeFields) => DateValidationError[];
  /** 特定フィールドにエラーがあるかチェック */
  hasFieldError: (field: string) => boolean;
  /** 特定フィールドのエラーメッセージを取得 */
  getFieldErrors: (field: string) => string[];
  /** すべてのエラーメッセージを取得 */
  getAllErrorMessages: () => string[];
  /** エラーをクリア */
  clearErrors: () => void;
  /** 現在のフィールド値 */
  fields: SimpleDateRangeFields;
};

/**
 * イベント用日付整合性チェックフック
 *
 * 仕様: 投稿開始 <= 申込開始 <= 申込終了 <= イベント開始 <= イベント終了 <= 投稿終了
 *
 * @example
 * ```tsx
 * const { errors, hasErrors, updateField, hasFieldError } = useEventDateValidation({
 *   publishStart: '2025-01-01T09:00',
 *   applicationStart: '2025-01-05T09:00',
 * });
 *
 * <input
 *   type="datetime-local"
 *   onChange={(e) => updateField('publishStart', e.target.value)}
 *   className={hasFieldError('publishStart') ? 'error' : ''}
 * />
 * ```
 */
export function useEventDateValidation(
  initialFields: EventDateFields = {},
): UseEventDateValidationReturn {
  const [fields, setFields] = useState<EventDateFields>(initialFields);
  const [errors, setErrors] = useState<DateValidationError[]>([]);
  const fieldsRef = useRef<EventDateFields>(initialFields);

  const validate = useCallback(
    (fieldsToValidate?: EventDateFields): DateValidationError[] => {
      const targetFields = fieldsToValidate || fieldsRef.current;
      const newErrors = validateEventDateSequence(targetFields);
      setErrors(newErrors);
      return newErrors;
    },
    [],
  );

  const updateField = useCallback(
    (field: keyof EventDateFields, value: string) => {
      const newFields = { ...fieldsRef.current, [field]: value };
      fieldsRef.current = newFields;
      setFields(newFields);
      validate(newFields);
    },
    [validate],
  );

  const updateAllFields = useCallback(
    (newFields: EventDateFields) => {
      fieldsRef.current = newFields;
      setFields(newFields);
      validate(newFields);
    },
    [validate],
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const hasErrors = useMemo(() => errors.length > 0, [errors]);

  const checkFieldError = useCallback(
    (field: string) => hasFieldError(errors, field),
    [errors],
  );

  const getFieldErrorMessages = useCallback(
    (field: string) => getFieldErrors(errors, field),
    [errors],
  );

  const getAllErrors = useCallback(() => getAllErrorMessages(errors), [errors]);

  return {
    errors,
    hasErrors,
    updateField,
    updateAllFields,
    validate,
    hasFieldError: checkFieldError,
    getFieldErrors: getFieldErrorMessages,
    getAllErrorMessages: getAllErrors,
    clearErrors,
    fields,
  };
}

/**
 * シンプルな開始・終了日付のバリデーションフック
 *
 * @example
 * ```tsx
 * const { errors, hasErrors, updateField } = useSimpleDateValidation(
 *   { start: '2025-01-01T09:00' },
 *   '公開開始',
 *   '公開終了'
 * );
 * ```
 */
export function useSimpleDateValidation(
  initialFields: SimpleDateRangeFields = {},
  startLabel = '開始',
  endLabel = '終了',
): UseSimpleDateValidationReturn {
  const [fields, setFields] = useState<SimpleDateRangeFields>(initialFields);
  const [errors, setErrors] = useState<DateValidationError[]>([]);
  const fieldsRef = useRef<SimpleDateRangeFields>(initialFields);
  const labelsRef = useRef({ startLabel, endLabel });

  const validate = useCallback(
    (fieldsToValidate?: SimpleDateRangeFields): DateValidationError[] => {
      const targetFields = fieldsToValidate || fieldsRef.current;
      const newErrors = validateSimpleDateRange(
        targetFields,
        labelsRef.current.startLabel,
        labelsRef.current.endLabel,
      );
      setErrors(newErrors);
      return newErrors;
    },
    [],
  );

  const updateField = useCallback(
    (field: keyof SimpleDateRangeFields, value: string) => {
      const newFields = { ...fieldsRef.current, [field]: value };
      fieldsRef.current = newFields;
      setFields(newFields);
      validate(newFields);
    },
    [validate],
  );

  const updateAllFields = useCallback(
    (newFields: SimpleDateRangeFields) => {
      fieldsRef.current = newFields;
      setFields(newFields);
      validate(newFields);
    },
    [validate],
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const hasErrors = useMemo(() => errors.length > 0, [errors]);

  const checkFieldError = useCallback(
    (field: string) => hasFieldError(errors, field),
    [errors],
  );

  const getFieldErrorMessages = useCallback(
    (field: string) => getFieldErrors(errors, field),
    [errors],
  );

  const getAllErrors = useCallback(() => getAllErrorMessages(errors), [errors]);

  return {
    errors,
    hasErrors,
    updateField,
    updateAllFields,
    validate,
    hasFieldError: checkFieldError,
    getFieldErrors: getFieldErrorMessages,
    getAllErrorMessages: getAllErrors,
    clearErrors,
    fields,
  };
}

/**
 * 個別相談用の日付バリデーションフックの戻り値型
 */
type UseConsultationDateValidationReturn = {
  /** 現在のエラー一覧 */
  errors: DateValidationError[];
  /** エラーがあるかどうか */
  hasErrors: boolean;
  /** 日付フィールドの値を更新してバリデーション実行 */
  updateField: (field: keyof ConsultationDateFields, value: string) => void;
  /** すべてのフィールドを一括更新してバリデーション実行 */
  updateAllFields: (fields: ConsultationDateFields) => void;
  /** 手動でバリデーションを実行 */
  validate: (fields?: ConsultationDateFields) => DateValidationError[];
  /** 特定フィールドにエラーがあるかチェック */
  hasFieldError: (field: string) => boolean;
  /** 特定フィールドのエラーメッセージを取得 */
  getFieldErrors: (field: string) => string[];
  /** すべてのエラーメッセージを取得 */
  getAllErrorMessages: () => string[];
  /** エラーをクリア */
  clearErrors: () => void;
  /** 現在のフィールド値 */
  fields: ConsultationDateFields;
};

/**
 * 個別相談用日付整合性チェックフック
 *
 * 仕様: 投稿開始 <= 申込開始 <= 申込終了 <= 投稿終了
 *
 * @example
 * ```tsx
 * const { errors, hasErrors, updateAllFields, hasFieldError } = useConsultationDateValidation({
 *   publishStart: '2025-01-01T09:00',
 *   applicationStart: '2025-01-05T09:00',
 * });
 * ```
 */
export function useConsultationDateValidation(
  initialFields: ConsultationDateFields = {},
): UseConsultationDateValidationReturn {
  const [fields, setFields] = useState<ConsultationDateFields>(initialFields);
  const [errors, setErrors] = useState<DateValidationError[]>([]);
  const fieldsRef = useRef<ConsultationDateFields>(initialFields);

  const validate = useCallback(
    (fieldsToValidate?: ConsultationDateFields): DateValidationError[] => {
      const targetFields = fieldsToValidate || fieldsRef.current;
      const newErrors = validateConsultationDateSequence(targetFields);
      setErrors(newErrors);
      return newErrors;
    },
    [],
  );

  const updateField = useCallback(
    (field: keyof ConsultationDateFields, value: string) => {
      const newFields = { ...fieldsRef.current, [field]: value };
      fieldsRef.current = newFields;
      setFields(newFields);
      validate(newFields);
    },
    [validate],
  );

  const updateAllFields = useCallback(
    (newFields: ConsultationDateFields) => {
      fieldsRef.current = newFields;
      setFields(newFields);
      validate(newFields);
    },
    [validate],
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const hasErrors = useMemo(() => errors.length > 0, [errors]);

  const checkFieldError = useCallback(
    (field: string) => hasFieldError(errors, field),
    [errors],
  );

  const getFieldErrorMessages = useCallback(
    (field: string) => getFieldErrors(errors, field),
    [errors],
  );

  const getAllErrors = useCallback(() => getAllErrorMessages(errors), [errors]);

  return {
    errors,
    hasErrors,
    updateField,
    updateAllFields,
    validate,
    hasFieldError: checkFieldError,
    getFieldErrors: getFieldErrorMessages,
    getAllErrorMessages: getAllErrors,
    clearErrors,
    fields,
  };
}
