import { useEffect, useState } from 'react';

/**
 * 指定されたメディアクエリが一致するかどうかを監視するカスタムフック
 * 画面サイズの変更に応じて値が更新される
 *
 * @param query メディアクエリ文字列 (例: '(max-width: 768px)')
 * @returns メディアクエリが一致するかどうかのブール値
 */
export function useMediaQuery(query: string): boolean {
  // SSRの場合はデフォルトでfalseを返す
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // ブラウザ環境でのみ実行
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);

      // 初期値を設定
      setMatches(media.matches);

      // リスナー関数
      const listener = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };

      // メディアクエリの変更を監視
      if (media.addEventListener) {
        media.addEventListener('change', listener);
      } else {
        // 古いブラウザ向け
        media.addListener(listener);
      }

      // クリーンアップ
      return () => {
        if (media.removeEventListener) {
          media.removeEventListener('change', listener);
        } else {
          // 古いブラウザ向け
          media.removeListener(listener);
        }
      };
    }

    // SSRの場合は何もしない
    return undefined;
  }, [query]);

  return matches;
}
