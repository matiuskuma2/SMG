import { createClient } from '@/lib/supabase';
import { MstNoticeCategory } from '@/lib/supabase/types';

/**
 * カテゴリー情報の型定義
 */
export type NoticeCategoryOption = {
  id: string;
  name: string;
  description?: string;
};

/**
 * 全てのお知らせカテゴリーを取得する
 * @param categoryType - 'notice' | 'shibu' | 'master' でフィルタ。省略時は全カテゴリ
 */
export async function getNoticeCategories(categoryType?: 'notice' | 'shibu' | 'master'): Promise<NoticeCategoryOption[]> {
  const supabase = createClient();
  
  try {
    let query = supabase
      .from('mst_notice_category')
      .select('category_id, category_name, description')
      .is('deleted_at', null)
      .order('created_at');

    // カテゴリタイプでフィルタ
    if (categoryType) {
      query = query.eq('description', categoryType);
    }
    
    const { data, error } = await query;
    
    if (error) {
      // テーブルが存在しない場合は空配列を返す
      console.warn('カテゴリーテーブルが見つかりませんでした:', error.message);
      return [];
    }
    
    return (data || []).map((item) => ({
      id: item.category_id,
      name: item.category_name,
      description: item.description || undefined
    }));
  } catch (error) {
    console.warn('カテゴリーの取得でエラーが発生しました:', error);
    return [];
  }
}

/**
 * 特定のカテゴリー情報を取得する
 */
export async function getNoticeCategoryById(categoryId: string): Promise<MstNoticeCategory | null> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('mst_notice_category')
      .select('*')
      .eq('category_id', categoryId)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      console.warn('カテゴリー詳細の取得に失敗しました:', error.message);
      return null;
    }
    
    return data;
  } catch (error) {
    console.warn('カテゴリー詳細の取得でエラーが発生しました:', error);
    return null;
  }
}