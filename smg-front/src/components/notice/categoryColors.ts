/**
 * お知らせカテゴリの色設定
 */
export type CategoryColorScheme = {
  bg: string;
  color: string;
  borderColor: string;
};

/**
 * カテゴリ名に基づいて色を取得する
 */
export function getCategoryColor(categoryName: string): CategoryColorScheme {
  switch (categoryName) {
    case 'トピックス':
      return {
        bg: '#eff6ff', // blue.50
        color: '#1d4ed8', // blue.700
        borderColor: '#bfdbfe', // blue.200
      };
    case '毎月のお知らせ・スケジュール':
      return {
        bg: '#f0fdf4', // green.50
        color: '#15803d', // green.700
        borderColor: '#bbf7d0', // green.200
      };
    case 'オリエンテーション':
      return {
        bg: '#faf5ff', // purple.50
        color: '#7c3aed', // purple.700
        borderColor: '#ddd6fe', // purple.200
      };
    case 'ニュースレター':
      return {
        bg: '#fff7ed', // orange.50
        color: '#c2410c', // orange.700
        borderColor: '#fed7aa', // orange.200
      };
    case 'ロードマップ':
      return {
        bg: '#fef2f2', // red.50
        color: '#b91c1c', // red.700
        borderColor: '#fecaca', // red.200
      };
    // 支部カテゴリ
    case '東北・北海道支部':
      return {
        bg: '#ecfdf5', // emerald.50
        color: '#065f46', // emerald.800
        borderColor: '#a7f3d0', // emerald.200
      };
    case '関東支部':
      return {
        bg: '#eff6ff', // blue.50
        color: '#1e40af', // blue.800
        borderColor: '#bfdbfe', // blue.200
      };
    case '中部支部':
      return {
        bg: '#fefce8', // yellow.50
        color: '#854d0e', // yellow.800
        borderColor: '#fef08a', // yellow.200
      };
    case '関西支部':
      return {
        bg: '#fff1f2', // rose.50
        color: '#9f1239', // rose.800
        borderColor: '#fecdd3', // rose.200
      };
    case '九州・沖縄支部':
      return {
        bg: '#f0fdfa', // teal.50
        color: '#115e59', // teal.800
        borderColor: '#99f6e4', // teal.200
      };
    // マスター講座カテゴリ
    case 'マスター講座':
      return {
        bg: '#fdf4ff', // fuchsia.50
        color: '#86198f', // fuchsia.800
        borderColor: '#f0abfc', // fuchsia.200
      };
    default:
      // デフォルトはグレー
      return {
        bg: '#f9fafb', // gray.50
        color: '#374151', // gray.700
        borderColor: '#e5e7eb', // gray.200
      };
  }
}