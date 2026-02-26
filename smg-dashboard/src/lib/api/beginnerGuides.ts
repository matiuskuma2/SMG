import { createClient } from '../supabase/client';
import type { MstBeginnerGuideItem } from '../supabase/types';

// MstBeginnerGuideItemをBeginnerGuideItemとして再エクスポート
export type BeginnerGuideItem = MstBeginnerGuideItem;

const supabase = createClient();

export async function getBeginnerGuideItems(): Promise<MstBeginnerGuideItem[]> {
  try {
    const { data, error } = await supabase
      .from('mst_beginner_guide_item')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching beginner guide items:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch beginner guide items:', error);
    throw error;
  }
}

export async function createBeginnerGuideItem(
  item: Omit<
    MstBeginnerGuideItem,
    'guide_item_id' | 'created_at' | 'updated_at' | 'deleted_at'
  >,
): Promise<MstBeginnerGuideItem> {
  try {
    const { data, error } = await supabase
      .from('mst_beginner_guide_item')
      .insert([item])
      .select()
      .single();

    if (error) {
      console.error('Error creating beginner guide item:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to create beginner guide item:', error);
    throw error;
  }
}

export async function updateBeginnerGuideItem(
  guide_item_id: string,
  item: Partial<
    Omit<
      MstBeginnerGuideItem,
      'guide_item_id' | 'created_at' | 'updated_at' | 'deleted_at'
    >
  >,
): Promise<MstBeginnerGuideItem> {
  try {
    const { data, error } = await supabase
      .from('mst_beginner_guide_item')
      .update({ ...item, updated_at: new Date().toISOString() })
      .eq('guide_item_id', guide_item_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating beginner guide item:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to update beginner guide item:', error);
    throw error;
  }
}

export async function deleteBeginnerGuideItem(
  guide_item_id: string,
): Promise<void> {
  try {
    // 論理削除を実装
    const { error } = await supabase
      .from('mst_beginner_guide_item')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('guide_item_id', guide_item_id);

    if (error) {
      console.error('Error deleting beginner guide item:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete beginner guide item:', error);
    throw error;
  }
}
