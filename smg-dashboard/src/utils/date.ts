export const formatDateRange = (
  startDateString: string,
  endDateString: string,
) => {
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);

  // 同じ日付かどうかをチェック
  const isSameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();

  if (isSameDay) {
    // 同じ日付の場合は、日付を一度だけ表示し、終了時間のみを表示
    const dateStr = startDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'Asia/Tokyo',
    });
    const startTimeStr = startDate.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo',
    });
    const endTimeStr = endDate.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo',
    });
    return `${dateStr} ${startTimeStr} ～ ${endTimeStr}`;
  }

  // 異なる日付の場合は、両方の日付を表示
  const startDateStr = startDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  });
  const endDateStr = endDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  });
  return `${startDateStr} ～ ${endDateStr}`;
};

/**
 * ISOString形式の日付をより見やすい形式に変換する
 * @param isoString ISOString形式の日付文字列
 * @returns フォーマットされた日付文字列 (例: 2025年5月30日 09:22)
 */
export function formatIsoDate(isoString: string): string {
  if (!isoString) return '';

  const date = new Date(isoString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  });
}

/**
 * 日付時刻を扱うユーティリティ関数
 */

/**
 * 日本時間の文字列をISOString形式のUTC時間に変換する
 * input format: 'YYYY-MM-DDThh:mm' (HTML datetime-local の形式)
 * @param jstDateTimeString 日本時間の文字列 (YYYY-MM-DDThh:mm)
 * @returns UTC時間のISOString
 */
export function jstToUtc(jstDateTimeString: string): string {
  if (!jstDateTimeString) return '';

  // 日本時間として解釈するためにゾーン情報を追加
  const jstDate = new Date(`${jstDateTimeString}:00+09:00`);
  return jstDate.toISOString();
}

/**
 * UTC時間のISOStringを日本時間のdatetime-local用文字列に変換する
 * @param utcString UTC時間のISOString
 * @returns 日本時間の文字列 (YYYY-MM-DDThh:mm)
 */
export function utcToJst(utcString: string): string {
  if (!utcString) return '';

  const date = new Date(utcString);

  // 日本時間のタイムゾーンオフセットを取得 (ミリ秒)
  const jstOffset = 9 * 60 * 60 * 1000;

  // UTCの時刻に9時間を加算して日本時間に変換
  const jstDate = new Date(date.getTime() + jstOffset);

  // YYYY-MM-DDThh:mm 形式に整形
  return jstDate.toISOString().slice(0, 16);
}
