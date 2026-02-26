'use client';

import { useCallback, useEffect, useState } from 'react';

export const useArrayForm = <T>(idKey: keyof T, value: T[] = []) => {
  const [initialValue, setInitialValue] = useState<T[]>(value);
  const [values, setValues] = useState<T[]>(value);

  useEffect(() => {
    setInitialValue([...value]);
  }, [value]);

  // 配列に要素を追加
  const push = useCallback((item: T) => {
    setValues((prev) => [...prev, item]);
  }, []);

  // 配列から指定インデックスの要素を削除
  const remove = useCallback((index: number) => {
    setValues((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 指定インデックスの要素を更新
  const update = useCallback(
    (index: number) => (item: T) => {
      setValues((prev) =>
        prev.map((existingItem, i) => (i === index ? item : existingItem)),
      );
    },
    [],
  );

  // 配列をクリア
  const clear = useCallback(() => {
    setValues([]);
  }, []);

  // 配列をリセット（初期値に戻す）
  const reset = useCallback(() => {
    setValues(initialValue);
  }, [initialValue]);

  // 指定インデックスに要素を挿入
  const insert = useCallback((index: number, item: T) => {
    setValues((prev) => [...prev.slice(0, index), item, ...prev.slice(index)]);
  }, []);

  // 配列を置き換え
  const replace = useCallback((newArray: T[]) => {
    setValues(newArray);
  }, []);

  // 差分を検出する関数（外部ユーティリティを使用）
  const getDiff = useCallback((): ArrayDiff<T> => {
    return calculateArrayDiffById<T>(initialValue, values, idKey);
  }, [values, initialValue, idKey]);

  // 元の配列から変更されているかチェック
  const hasChanges = useCallback((): boolean => {
    return getDiff().hasChanges;
  }, [getDiff]);

  return {
    values,
    push,
    remove,
    update,
    clear,
    reset,
    insert,
    replace,
    length: values.length,
    isEmpty: values.length === 0,
    getDiff,
    hasChanges,
  };
};

// 差分検出用の型定義
export type ArrayDiff<T> = {
  added: T[];
  removed: T[];
  modified: { original: T; current: T }[];
  unchanged: T[];
  hasChanges: boolean;
};

// 深い比較を行うユーティリティ関数（型安全版）
const deepEqual = <T>(a: T, b: T): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;

  // プリミティブ型の場合
  if (typeof a !== 'object' || typeof b !== 'object') {
    return a === b;
  }

  // 配列の場合
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  // 一方が配列でもう一方がオブジェクトの場合
  if (Array.isArray(a) || Array.isArray(b)) {
    return false;
  }

  // オブジェクトの場合
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  const keysA = Object.keys(aObj);
  const keysB = Object.keys(bObj);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(aObj[key], bObj[key])) return false;
  }

  return true;
};

const calculateArrayDiffById = <T, K extends keyof T = keyof T>(
  originalArray: T[],
  currentArray: T[],
  idKey: K,
): ArrayDiff<T> => {
  const added: T[] = [];
  const removed: T[] = [];
  const modified: { original: T; current: T }[] = [];
  const unchanged: T[] = [];

  const originalMap = new Map(originalArray.map((d) => [d[idKey], d]));
  const currentMap = new Map(currentArray.map((d) => [d[idKey], d]));

  for (const current of currentArray) {
    const id = current[idKey];
    const original = originalMap.get(id);

    if (original) {
      if (deepEqual(original, current)) {
        unchanged.push(current);
      } else {
        modified.push({ original, current });
      }
    } else {
      added.push(current);
    }
  }

  for (const original of originalArray) {
    const id = original[idKey];
    if (!currentMap.has(id)) removed.push(original);
  }

  const hasChanges =
    added.length > 0 || removed.length > 0 || modified.length > 0;

  return {
    added,
    removed,
    modified,
    unchanged,
    hasChanges,
  };
};
