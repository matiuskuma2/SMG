/**
 * 日付整合性チェックのバリデーションロジック
 *
 * 仕様: 投稿開始 <= 申込開始 <= 申込終了 <= イベント開始 <= イベント終了 <= 投稿終了
 */

/**
 * 日付バリデーションエラーの型
 */
export type DateValidationError = {
  field: string;
  message: string;
};

/**
 * イベント用の日付フィールド型
 */
export type EventDateFields = {
  publishStart?: string; // 投稿開始
  publishEnd?: string; // 投稿終了
  applicationStart?: string; // 申込開始
  applicationEnd?: string; // 申込終了
  eventStart?: string; // イベント開始
  eventEnd?: string; // イベント終了
};

/**
 * シンプルな開始・終了の日付フィールド型
 */
export type SimpleDateRangeFields = {
  start?: string;
  end?: string;
};

/**
 * 日付フィールドのラベル定義
 */
export const DATE_FIELD_LABELS: Record<string, string> = {
  publishStart: '投稿開始',
  publishEnd: '投稿終了',
  applicationStart: '申込開始',
  applicationEnd: '申込終了',
  eventStart: 'イベント開始',
  eventEnd: 'イベント終了',
  start: '開始',
  end: '終了',
};

/**
 * 無期限日付かどうかをチェック
 */
export function isUnlimitedDate(dateString?: string): boolean {
  if (!dateString) return false;
  return dateString.startsWith('2200');
}

/**
 * 日付文字列をDateオブジェクトに変換
 * datetime-local形式 (YYYY-MM-DDThh:mm) を想定
 */
function parseDate(dateString?: string): Date | null {
  if (!dateString || dateString.trim() === '') return null;
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * 2つの日付を比較
 * @returns -1: date1 < date2, 0: date1 === date2, 1: date1 > date2
 */
function compareDates(date1: Date, date2: Date): number {
  const time1 = date1.getTime();
  const time2 = date2.getTime();
  if (time1 < time2) return -1;
  if (time1 > time2) return 1;
  return 0;
}

/**
 * シンプルな開始・終了の整合性チェック
 * start <= end を検証
 */
export function validateSimpleDateRange(
  fields: SimpleDateRangeFields,
  startLabel = '開始',
  endLabel = '終了',
): DateValidationError[] {
  const errors: DateValidationError[] = [];
  const start = parseDate(fields.start);
  const end = parseDate(fields.end);

  if (start && end && !isUnlimitedDate(fields.end)) {
    if (compareDates(start, end) > 0) {
      errors.push({
        field: 'end',
        message: `${endLabel}日時は${startLabel}日時より後に設定してください`,
      });
    }
  }

  return errors;
}

/**
 * イベント用の日付整合性チェック
 * 仕様: 投稿開始 <= 申込開始 <= 申込終了 <= イベント開始 <= イベント終了 <= 投稿終了
 */
export function validateEventDateSequence(
  fields: EventDateFields,
): DateValidationError[] {
  const errors: DateValidationError[] = [];

  const publishStart = parseDate(fields.publishStart);
  const publishEnd = parseDate(fields.publishEnd);
  const applicationStart = parseDate(fields.applicationStart);
  const applicationEnd = parseDate(fields.applicationEnd);
  const eventStart = parseDate(fields.eventStart);
  const eventEnd = parseDate(fields.eventEnd);

  const isPublishEndUnlimited = isUnlimitedDate(fields.publishEnd);

  // 1. 投稿開始 <= 申込開始
  if (publishStart && applicationStart) {
    if (compareDates(publishStart, applicationStart) > 0) {
      errors.push({
        field: 'applicationStart',
        message: '申込開始日時は投稿開始日時より後に設定してください',
      });
    }
  }

  // 2. 申込開始 <= 申込終了
  if (applicationStart && applicationEnd) {
    if (compareDates(applicationStart, applicationEnd) > 0) {
      errors.push({
        field: 'applicationEnd',
        message: '申込終了日時は申込開始日時より後に設定してください',
      });
    }
  }

  // 3. 申込終了 <= イベント開始
  if (applicationEnd && eventStart) {
    if (compareDates(applicationEnd, eventStart) > 0) {
      errors.push({
        field: 'eventStart',
        message: 'イベント開始日時は申込終了日時より後に設定してください',
      });
    }
  }

  // 4. イベント開始 <= イベント終了
  if (eventStart && eventEnd) {
    if (compareDates(eventStart, eventEnd) > 0) {
      errors.push({
        field: 'eventEnd',
        message: 'イベント終了日時はイベント開始日時より後に設定してください',
      });
    }
  }

  // 5. イベント終了 <= 投稿終了 (無期限でない場合のみ)
  if (eventEnd && publishEnd && !isPublishEndUnlimited) {
    if (compareDates(eventEnd, publishEnd) > 0) {
      errors.push({
        field: 'publishEnd',
        message: '投稿終了日時はイベント終了日時より後に設定してください',
      });
    }
  }

  // 6. 投稿開始 <= 投稿終了 (無期限でない場合のみ)
  if (publishStart && publishEnd && !isPublishEndUnlimited) {
    if (compareDates(publishStart, publishEnd) > 0) {
      errors.push({
        field: 'publishEnd',
        message: '投稿終了日時は投稿開始日時より後に設定してください',
      });
    }
  }

  return errors;
}

/**
 * 特定のフィールドに関するエラーがあるかチェック
 */
export function hasFieldError(
  errors: DateValidationError[],
  field: string,
): boolean {
  return errors.some((error) => error.field === field);
}

/**
 * 特定のフィールドに関するエラーメッセージを取得
 */
export function getFieldErrors(
  errors: DateValidationError[],
  field: string,
): string[] {
  return errors.filter((error) => error.field === field).map((e) => e.message);
}

/**
 * すべてのエラーメッセージを取得
 */
export function getAllErrorMessages(errors: DateValidationError[]): string[] {
  return errors.map((error) => error.message);
}

/**
 * 個別相談用の日付フィールド型
 */
export type ConsultationDateFields = {
  publishStart?: string; // 投稿開始
  publishEnd?: string; // 投稿終了
  applicationStart?: string; // 申込開始
  applicationEnd?: string; // 申込終了
};

/**
 * 個別相談用の日付整合性チェック
 * 仕様: 投稿開始 <= 申込開始 <= 申込終了 <= 投稿終了
 */
export function validateConsultationDateSequence(
  fields: ConsultationDateFields,
): DateValidationError[] {
  const errors: DateValidationError[] = [];

  const publishStart = parseDate(fields.publishStart);
  const publishEnd = parseDate(fields.publishEnd);
  const applicationStart = parseDate(fields.applicationStart);
  const applicationEnd = parseDate(fields.applicationEnd);

  const isPublishEndUnlimited = isUnlimitedDate(fields.publishEnd);

  // 1. 投稿開始 <= 申込開始
  if (publishStart && applicationStart) {
    if (compareDates(publishStart, applicationStart) > 0) {
      errors.push({
        field: 'applicationStart',
        message: '申込開始日時は投稿開始日時より後に設定してください',
      });
    }
  }

  // 2. 申込開始 <= 申込終了
  if (applicationStart && applicationEnd) {
    if (compareDates(applicationStart, applicationEnd) > 0) {
      errors.push({
        field: 'applicationEnd',
        message: '申込終了日時は申込開始日時より後に設定してください',
      });
    }
  }

  // 3. 申込終了 <= 投稿終了 (無期限でない場合のみ)
  if (applicationEnd && publishEnd && !isPublishEndUnlimited) {
    if (compareDates(applicationEnd, publishEnd) > 0) {
      errors.push({
        field: 'publishEnd',
        message: '投稿終了日時は申込終了日時より後に設定してください',
      });
    }
  }

  // 4. 投稿開始 <= 投稿終了 (無期限でない場合のみ)
  if (publishStart && publishEnd && !isPublishEndUnlimited) {
    if (compareDates(publishStart, publishEnd) > 0) {
      errors.push({
        field: 'publishEnd',
        message: '投稿終了日時は投稿開始日時より後に設定してください',
      });
    }
  }

  return errors;
}
