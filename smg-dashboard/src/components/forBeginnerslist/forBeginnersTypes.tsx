// 初めての方へに関する型定義
import type { MstBeginnerGuideItem } from '@/lib/supabase/types';

// Supabaseの型をそのまま使用
export type BeginnerGuideItem = MstBeginnerGuideItem;

// 下位互換性のため、ForBeginnersはBeginnerGuideItemのエイリアスとして残す
export type ForBeginners = BeginnerGuideItem;

// マッピング関数は不要になったが、下位互換性のために残す（実際は何もしない）
export function mapBeginnerGuideItemToForBeginners(
  item: MstBeginnerGuideItem,
): BeginnerGuideItem {
  return item;
}
