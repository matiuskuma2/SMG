/**
 * HTMLからプレーンテキストへ変換するユーティリティ
 * リッチテキストエディタ（Quill）から出力されたHTMLをメール送信用のテキストに変換する
 */

/**
 * HTMLエンティティをデコードする
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&hellip;': '...',
    '&mdash;': '—',
    '&ndash;': '–',
  };

  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char);
  }

  // 数値エンティティもデコード (例: &#123;)
  result = result.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(Number.parseInt(code, 10)),
  );

  return result;
}

/**
 * HTMLをプレーンテキストに変換する
 * - HTMLタグを削除
 * - ブロック要素は改行に変換
 * - 画像タグは除去（base64データを含むため）
 * - HTMLエンティティをデコード
 */
export function htmlToPlainText(html: string): string {
  if (!html) {
    return '';
  }

  let text = html;

  // 画像タグを完全に除去（base64データを含む可能性があるため）
  text = text.replace(/<img[^>]*>/gi, '');

  // スクリプトとスタイルタグを内容ごと削除
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // ブロック要素を改行に変換
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n');

  // リスト項目にはマーカーを追加
  text = text.replace(/<li[^>]*>/gi, '・');

  // 残りのHTMLタグを削除
  text = text.replace(/<[^>]+>/g, '');

  // HTMLエンティティをデコード
  text = decodeHtmlEntities(text);

  // 連続する空白を1つに
  text = text.replace(/[ \t]+/g, ' ');

  // 連続する改行を最大2つに
  text = text.replace(/\n{3,}/g, '\n\n');

  // 行頭・行末の空白を削除
  text = text
    .split('\n')
    .map((line) => line.trim())
    .join('\n');

  // 前後の空白を削除
  text = text.trim();

  return text;
}

/**
 * HTMLコンテンツを短く要約する（メール件名やプレビュー用）
 * @param html HTMLコンテンツ
 * @param maxLength 最大文字数（デフォルト: 50）
 */
export function htmlToSummary(html: string, maxLength = 50): string {
  const text = htmlToPlainText(html);

  // 改行を空白に置換
  const singleLine = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

  if (singleLine.length <= maxLength) {
    return singleLine;
  }

  return `${singleLine.substring(0, maxLength)}...`;
}

/**
 * 文字列をHTMLエスケープする（XSS対策）
 * HTMLメールに埋め込む際に使用
 */
export function escapeHtml(text: string): string {
  if (!text) {
    return '';
  }

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * HTMLコンテンツを安全なHTML用要約に変換する（XSS対策済み）
 * HTMLメール本文に埋め込む際に使用
 * @param html HTMLコンテンツ
 * @param maxLength 最大文字数（デフォルト: 50）
 */
export function htmlToSafeHtmlSummary(html: string, maxLength = 50): string {
  const summary = htmlToSummary(html, maxLength);
  return escapeHtml(summary);
}
