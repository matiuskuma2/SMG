/**
 * リストページから編集ページに遷移する際に、現在のクエリパラメータを保持するユーティリティ関数
 */

/**
 * 現在のクエリパラメータを文字列として取得
 * @param searchParams - URLSearchParams
 * @returns クエリパラメータ文字列（例: "page=2&search=test"）
 */
export function getQueryParamsString(
  searchParams: URLSearchParams | null,
): string {
  if (!searchParams) return '';

  const params = new URLSearchParams();
  searchParams.forEach((value: string, key: string) => {
    params.set(key, value);
  });

  const queryString = params.toString();
  return queryString ? queryString : '';
}

/**
 * 編集ページから戻る際に使用するリストページURLを生成
 * @param listPath - リストページのパス（例: "/radiolist"）
 * @param searchParams - URLSearchParams
 * @returns クエリパラメータを含むURL（例: "/radiolist?page=2&search=test"）
 */
export function buildListPageUrl(
  listPath: string,
  searchParams: URLSearchParams | null,
): string {
  const queryString = getQueryParamsString(searchParams);
  return queryString ? `${listPath}?${queryString}` : listPath;
}

/**
 * 編集ページへ遷移する際に使用するURLを生成
 * @param editPath - 編集ページのパス（例: "/radio/edit/123"）
 * @param searchParams - URLSearchParams
 * @returns クエリパラメータを含むURL（例: "/radio/edit/123?returnQuery=page%3D2%26search%3Dtest"）
 */
export function buildEditPageUrl(
  editPath: string,
  searchParams: URLSearchParams | null,
): string {
  const queryString = getQueryParamsString(searchParams);
  if (!queryString) return editPath;

  // returnQuery パラメータとしてエンコードして渡す
  return `${editPath}?returnQuery=${encodeURIComponent(queryString)}`;
}

/**
 * 編集ページのURLから returnQuery を取得してデコード
 * @param searchParams - URLSearchParams
 * @returns デコードされたクエリパラメータ文字列
 */
export function getReturnQuery(searchParams: URLSearchParams | null): string {
  if (!searchParams) return '';

  const returnQuery = searchParams.get('returnQuery');
  return returnQuery ? decodeURIComponent(returnQuery) : '';
}
