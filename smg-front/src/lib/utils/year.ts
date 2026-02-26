/**
 * 現在の年を基準に過去指定年分の年リストを生成
 * @param count 取得する年数（デフォルト: 3）
 * @returns 年の配列（新しい順）
 */
export function getFilterYears(count: number = 3): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => currentYear - i);
}
