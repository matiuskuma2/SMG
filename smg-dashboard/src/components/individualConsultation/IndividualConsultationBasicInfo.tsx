import {
  DateValidationErrors,
  FieldDateError,
} from '@/components/ui/DateValidationErrors';
import { useConsultationDateValidation } from '@/hooks/useDateTimeValidation';
import { DEFAULT_PUBLISH_END_DATE } from '@/lib/constants';
import { css } from '@/styled-system/css';
import type {
  IndividualConsultationFormType,
  Instructor,
} from '@/types/individualConsultation';
import { utcToJst } from '@/utils/date';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { SelectField } from '../ui/SelectField';
import { UnlimitedToggle } from '../ui/UnlimitedToggle';

type IndividualConsultationBasicInfoProps = {
  initialData?: Partial<IndividualConsultationFormType> & {
    thumbnail?: string | null;
  };
  onThumbnailChange: (file: File | null) => void;
  imageError?: string | null;
  onValidationChange?: (hasErrors: boolean) => void;
};

// APIレスポンスの型定義
type InstructorResponse = {
  id: string;
  name: string;
  icon: string;
};

const inputStyle = css({
  border: '1px solid',
  borderColor: 'gray.300',
  p: '2',
  borderRadius: 'md',
  width: '100%',
  outline: 'none',
  _focus: { borderColor: 'blue.500' },
});

const SectionHeader = ({ title }: { title: string }) => (
  <h2
    className={css({
      fontSize: 'lg',
      fontWeight: 'bold',
      mb: '4',
      borderLeft: '4px solid',
      borderColor: 'blue.500',
      pl: '2',
    })}
  >
    {title}
  </h2>
);

const FormField = ({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className={css({ mb: '4' })}>
    <label
      htmlFor={htmlFor}
      className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
    >
      {label} {required && <span className={css({ color: 'red.500' })}>*</span>}
    </label>
    {children}
  </div>
);

const DateTimeInputField = ({
  id,
  name,
  label,
  required = false,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
}) => {
  return (
    <FormField label={label} htmlFor={id} required={required}>
      <input
        id={id}
        type="datetime-local"
        name={name}
        defaultValue={defaultValue}
        required={required}
        autoComplete="one-time-code"
        className={inputStyle}
      />
    </FormField>
  );
};

const MAX_CANDIDATES = 50;
const CandidateDateTimeList = ({
  initialDates = [''],
}: {
  initialDates?: string[];
}) => {
  const [dates, setDates] = useState<string[]>(
    initialDates.map((date) => {
      if (!date) return '';
      // UTC形式の日時をJSTに変換し、datetime-local用のフォーマットに整形
      const jstDate = utcToJst(date);
      return jstDate.split('.')[0]; // ミリ秒部分を削除
    }),
  );
  const [dateIds] = useState(() => dates.map(() => crypto.randomUUID()));

  const handleChange = (i: number, value: string) => {
    const next = [...dates];
    next[i] = value;
    setDates(next);
  };

  const add = () => {
    if (dates.length < MAX_CANDIDATES) {
      setDates([...dates, '']);
      dateIds.push(crypto.randomUUID());
    }
  };

  const remove = (i: number) => {
    const next = [...dates];
    next.splice(i, 1);
    setDates(next);
    dateIds.splice(i, 1);
  };

  return (
    <div className={css({ mb: '6' })}>
      <label
        htmlFor="candidateDateTime-0"
        className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
      >
        候補日時（最大50件）
      </label>

      {dates.map((val, i) => (
        <div
          key={dateIds[i]}
          className={css({ display: 'flex', gap: '2', mb: '2' })}
        >
          <input
            id={`candidateDateTime-${i}`}
            name="candidateDateTimes"
            type="datetime-local"
            value={val}
            autoComplete="one-time-code"
            onChange={(e) => handleChange(i, e.target.value)}
            className={inputStyle}
            required={i === 0}
          />
          {dates.length > 1 && (
            <button
              type="button"
              onClick={() => remove(i)}
              className={css({
                px: '3',
                borderRadius: 'md',
                bg: 'red.100',
                color: 'red.700',
                fontSize: 'sm',
                _hover: { bg: 'red.200' },
              })}
            >
              削除
            </button>
          )}
        </div>
      ))}

      {dates.length < MAX_CANDIDATES && (
        <button
          type="button"
          onClick={add}
          className={css({
            mt: '2',
            fontSize: 'sm',
            px: '3',
            py: '1',
            borderRadius: 'md',
            border: '1px solid',
            borderColor: 'gray.300',
            bg: 'gray.50',
            _hover: { bg: 'gray.100' },
          })}
        >
          候補日を追加
        </button>
      )}
    </div>
  );
};

export const IndividualConsultationBasicInfo = ({
  initialData = {},
  onThumbnailChange,
  imageError,
  onValidationChange,
}: IndividualConsultationBasicInfoProps) => {
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(() =>
    typeof initialData.image_url === 'string' ? initialData.image_url : null,
  );
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [instructorError, setInstructorError] = useState<string | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<
    string | undefined
  >(initialData.instructor_id);

  function getDefaultValue(key: keyof IndividualConsultationFormType): string {
    const val = initialData?.[key];
    if (typeof val === 'string') {
      return utcToJst(val);
    }
    return '';
  }

  const [publishStartAt, setPublishStartAt] = useState(
    getDefaultValue('publish_start_at'),
  );
  const [publishEndAt, setPublishEndAt] = useState(
    getDefaultValue('publish_end_at'),
  );
  const [isUnlimited, setIsUnlimited] = useState(
    getDefaultValue('publish_end_at').startsWith('2200') || false,
  );
  const [applicationStartAt, setApplicationStartAt] = useState(
    getDefaultValue('application_start_datetime'),
  );
  const [applicationEndAt, setApplicationEndAt] = useState(
    getDefaultValue('application_end_datetime'),
  );

  // 日付整合性チェック（投稿開始 <= 申込開始 <= 申込終了 <= 投稿終了）
  const {
    errors: dateErrors,
    hasErrors: hasDateErrors,
    updateAllFields: updateDateFields,
    hasFieldError: hasDateFieldError,
  } = useConsultationDateValidation({
    publishStart: getDefaultValue('publish_start_at'),
    publishEnd: isUnlimited
      ? DEFAULT_PUBLISH_END_DATE
      : getDefaultValue('publish_end_at'),
    applicationStart: getDefaultValue('application_start_datetime'),
    applicationEnd: getDefaultValue('application_end_datetime'),
  });

  // 日付バリデーション更新
  const updateDateValidation = useCallback(() => {
    updateDateFields({
      publishStart: publishStartAt,
      publishEnd: isUnlimited ? DEFAULT_PUBLISH_END_DATE : publishEndAt,
      applicationStart: applicationStartAt,
      applicationEnd: applicationEndAt,
    });
  }, [
    publishStartAt,
    publishEndAt,
    isUnlimited,
    applicationStartAt,
    applicationEndAt,
    updateDateFields,
  ]);

  // 日付が変更されたらバリデーション実行
  useEffect(() => {
    updateDateValidation();
  }, [updateDateValidation]);

  // エラー状態を親コンポーネントに通知
  useEffect(() => {
    onValidationChange?.(hasDateErrors);
  }, [hasDateErrors, onValidationChange]);

  // 無期限トグルの変更時の処理
  const handleUnlimitedChange = (checked: boolean) => {
    setIsUnlimited(checked);
    if (checked) {
      setPublishEndAt(DEFAULT_PUBLISH_END_DATE);
    } else {
      setPublishEndAt(getDefaultValue('publish_end_at'));
    }
  };

  // 講師情報を取得
  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        setLoadingInstructors(true);
        setInstructorError(null);

        const response = await fetch('/api/instructors');

        if (!response.ok) {
          throw new Error('講師情報の取得に失敗しました');
        }

        const data = await response.json();
        // APIレスポンスを型定義に合わせて変換
        const formattedData = data.map((instructor: InstructorResponse) => ({
          user_id: instructor.id,
          username: instructor.name,
          ...instructor,
        }));
        setInstructors(formattedData);
      } catch (error) {
        console.error('講師データ取得エラー:', error);
        setInstructorError('講師情報の読み込みに失敗しました');
      } finally {
        setLoadingInstructors(false);
      }
    };

    fetchInstructors();
  }, []);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onThumbnailChange(file);

    if (thumbnailPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(thumbnailPreview);
    }

    const newPreview = file ? URL.createObjectURL(file) : null;
    setThumbnailPreview(newPreview);
  };

  useEffect(() => {
    return () => {
      if (thumbnailPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  const getDefault = (
    key: keyof IndividualConsultationFormType,
  ): string | undefined => {
    const val = initialData?.[key];
    if (typeof val === 'string') {
      return utcToJst(val);
    }
    return undefined;
  };

  return (
    <section>
      <SectionHeader title="個別相談の内容" />

      <FormField label="タイトル" htmlFor="title" required>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={initialData.title || ''}
          className={inputStyle}
        />
      </FormField>

      <FormField label="サムネイル" htmlFor="thumbnailFile">
        <div
          className={css({
            display: 'flex',
            flexDir: { base: 'column', md: 'row' },
            gap: '4',
            alignItems: { md: 'center' },
          })}
        >
          <div
            className={css({
              width: '200px',
              height: '150px',
              border: '1px dashed',
              borderColor: imageError ? 'red.500' : 'gray.300',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              bg: 'white',
            })}
          >
            {thumbnailPreview ? (
              <Image
                src={thumbnailPreview}
                alt="サムネイルプレビュー"
                fill
                sizes="200px"
                style={{ objectFit: 'cover' }}
                priority
                unoptimized={thumbnailPreview.startsWith('blob:')}
              />
            ) : (
              <span className={css({ color: 'gray.500' })}>プレビュー</span>
            )}
          </div>
          <div
            className={css({ flex: '1', display: 'flex', flexDir: 'column' })}
          >
            <label
              htmlFor="thumbnailFile"
              className={css({
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2',
                bg: 'blue.500',
                color: 'white',
                px: '4',
                py: '2',
                borderRadius: 'md',
                cursor: 'pointer',
                fontSize: 'sm',
                fontWeight: 'medium',
                _hover: { bg: 'blue.600' },
                transition: 'background-color 0.2s',
                width: 'fit-content',
              })}
            >
              画像を選択
              <input
                id="thumbnailFile"
                type="file"
                name="thumbnailFile"
                accept="image/jpeg,image/png"
                onChange={handleThumbnailChange}
                className={css({
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  padding: '0',
                  margin: '-1px',
                  overflow: 'hidden',
                  clip: 'rect(0, 0, 0, 0)',
                  whiteSpace: 'nowrap',
                  border: '0',
                })}
              />
            </label>
            {imageError && (
              <div
                className={css({ color: 'red.500', mt: '1', fontSize: 'sm' })}
              >
                {imageError}
              </div>
            )}
          </div>
        </div>
      </FormField>

      {/* 日付整合性エラー表示 */}
      {hasDateErrors && <DateValidationErrors errors={dateErrors} />}

      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: { base: '1fr', md: '1fr 1fr' },
          gap: '4',
          mb: '4',
        })}
      >
        <div>
          <label
            htmlFor="publish_start_at"
            className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
          >
            投稿開始日時 <span className={css({ color: 'red.500' })}>*</span>
          </label>
          <input
            id="publish_start_at"
            type="datetime-local"
            name="publish_start_at"
            value={publishStartAt}
            autoComplete="one-time-code"
            onChange={(e) => setPublishStartAt(e.target.value)}
            required
            className={css({
              border: '1px solid',
              borderColor: hasDateFieldError('publishStart')
                ? 'red.500'
                : 'gray.300',
              p: '2',
              borderRadius: 'md',
              width: '100%',
              outline: 'none',
              _focus: { borderColor: 'blue.500' },
            })}
          />
          <FieldDateError errors={dateErrors} field="publishStart" />
        </div>
        <div>
          <div
            className={css({
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: '2',
            })}
          >
            <label
              htmlFor="publish_end_at"
              className={css({ fontWeight: 'medium' })}
            >
              投稿終了日時 <span className={css({ color: 'red.500' })}>*</span>
            </label>
            <UnlimitedToggle
              checked={isUnlimited}
              onChange={handleUnlimitedChange}
            />
          </div>
          <input
            id="publish_end_at"
            type="datetime-local"
            name="publish_end_at"
            value={isUnlimited ? '' : publishEndAt}
            autoComplete="one-time-code"
            onChange={(e) => setPublishEndAt(e.target.value)}
            required={!isUnlimited}
            disabled={isUnlimited}
            className={css({
              border: '1px solid',
              borderColor: hasDateFieldError('publishEnd')
                ? 'red.500'
                : 'gray.300',
              p: '2',
              borderRadius: 'md',
              width: '100%',
              outline: 'none',
              _focus: { borderColor: 'blue.500' },
              opacity: isUnlimited ? 0.5 : 1,
            })}
          />
          {isUnlimited && (
            <input
              type="hidden"
              name="publish_end_at"
              value={DEFAULT_PUBLISH_END_DATE}
            />
          )}
          <FieldDateError errors={dateErrors} field="publishEnd" />
        </div>
      </div>

      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: { base: '1fr', md: '1fr 1fr' },
          gap: '4',
          mb: '4',
        })}
      >
        <div>
          <label
            htmlFor="application_start_datetime"
            className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
          >
            申込開始日時 <span className={css({ color: 'red.500' })}>*</span>
          </label>
          <input
            id="application_start_datetime"
            type="datetime-local"
            name="application_start_datetime"
            value={applicationStartAt}
            autoComplete="one-time-code"
            onChange={(e) => setApplicationStartAt(e.target.value)}
            required
            className={css({
              border: '1px solid',
              borderColor: hasDateFieldError('applicationStart')
                ? 'red.500'
                : 'gray.300',
              p: '2',
              borderRadius: 'md',
              width: '100%',
              outline: 'none',
              _focus: { borderColor: 'blue.500' },
            })}
          />
          <FieldDateError errors={dateErrors} field="applicationStart" />
        </div>
        <div>
          <label
            htmlFor="application_end_datetime"
            className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
          >
            申込終了日時 <span className={css({ color: 'red.500' })}>*</span>
          </label>
          <input
            id="application_end_datetime"
            type="datetime-local"
            name="application_end_datetime"
            value={applicationEndAt}
            autoComplete="one-time-code"
            onChange={(e) => setApplicationEndAt(e.target.value)}
            required
            className={css({
              border: '1px solid',
              borderColor: hasDateFieldError('applicationEnd')
                ? 'red.500'
                : 'gray.300',
              p: '2',
              borderRadius: 'md',
              width: '100%',
              outline: 'none',
              _focus: { borderColor: 'blue.500' },
            })}
          />
          <FieldDateError errors={dateErrors} field="applicationEnd" />
        </div>
      </div>

      <CandidateDateTimeList
        initialDates={
          Array.isArray(initialData.schedule_datetime) &&
          initialData.schedule_datetime.length > 0
            ? initialData.schedule_datetime
            : ['']
        }
      />

      <FormField label="講師名" htmlFor="instructorName" required>
        {instructorError && (
          <div className={css({ color: 'red.500', mb: '2', fontSize: 'sm' })}>
            {instructorError}
          </div>
        )}
        {loadingInstructors && (
          <div className={css({ color: 'blue.500', mb: '2', fontSize: 'sm' })}>
            講師情報を読み込み中...
          </div>
        )}
        <SelectField
          name="instructorName"
          value={selectedInstructor}
          options={instructors.map((instructor) => ({
            id: instructor.user_id,
            name: instructor.username || '',
          }))}
          required
          placeholder="講師を選択してください"
          onChange={(e) => {
            setSelectedInstructor(e.target.value);
          }}
        />
      </FormField>

      <FormField label="説明文" htmlFor="description" required>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          defaultValue={initialData.description || ''}
          className={inputStyle}
        />
      </FormField>
    </section>
  );
};
