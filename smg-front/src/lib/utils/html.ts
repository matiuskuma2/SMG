/**
 * HTMLタグを除去してプレーンテキストを取得するユーティリティ関数
 */

/**
 * HTMLタグを除去し、HTMLエンティティをデコードしてプレーンテキストを返す
 * @param html - HTMLコンテンツを含む文字列
 * @returns プレーンテキスト
 */
export const stripHtmlTags = (html: string): string => {
	// HTMLタグを除去
	const withoutTags = html.replace(/<[^>]*>/g, '');
	// HTMLエンティティをデコード
	const decoded = withoutTags
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, ' ');
	return decoded;
};

/**
 * HTMLコンテンツから指定した文字数までの要約テキストを生成する
 * @param html - HTMLコンテンツを含む文字列
 * @param maxLength - 最大文字数（デフォルト: 80）
 * @returns 要約されたプレーンテキスト
 */
export const createTextSummary = (html: string, maxLength: number = 80): string => {
	const plainText = stripHtmlTags(html);
	const firstLine = plainText.split('\n')[0];
	return firstLine.length > maxLength
		? `${firstLine.substring(0, maxLength)}...`
		: firstLine;
};