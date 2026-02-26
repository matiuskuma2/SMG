import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { Faq, FaqInput } from '@/types/faq';

// クライアントサイドでのFAQリスト取得
export async function getFaqsClient() {
  try {
    const supabase = createBrowserClient();

    const { data, error } = await supabase
      .from('mst_faq')
      .select('*')
      .is('deleted_at', null)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching FAQs:', error);
      return [];
    }

    return data as Faq[];
  } catch (error) {
    console.error('Error in getFaqsClient:', error);
    return [];
  }
}

// FAQ詳細取得
export async function getFaqById(faqId: string) {
  try {
    const supabase = createBrowserClient();

    const { data, error } = await supabase
      .from('mst_faq')
      .select('*')
      .eq('faq_id', faqId)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('Error fetching FAQ:', error);
      return null;
    }

    return data as Faq;
  } catch (error) {
    console.error('Error in getFaqById:', error);
    return null;
  }
}

// 表示順の重複をチェックして調整する
async function adjustDisplayOrder(targetOrder: number, excludeFaqId?: string) {
  try {
    const supabase = createBrowserClient();

    // 指定された表示順以上のFAQを取得（更新対象のFAQは除外）
    let query = supabase
      .from('mst_faq')
      .select('faq_id, display_order')
      .gte('display_order', targetOrder)
      .is('deleted_at', null)
      .order('display_order', { ascending: true });

    if (excludeFaqId) {
      query = query.neq('faq_id', excludeFaqId);
    }

    const { data: faqs, error } = await query;

    if (error) {
      console.error('Error fetching FAQs for adjustment:', error);
      throw error;
    }

    // 表示順を1つずつ増やす
    if (faqs && faqs.length > 0) {
      for (const faq of faqs) {
        const { error: updateError } = await supabase
          .from('mst_faq')
          .update({ display_order: faq.display_order + 1 })
          .eq('faq_id', faq.faq_id);

        if (updateError) {
          console.error('Error adjusting display order:', updateError);
          throw updateError;
        }
      }
    }
  } catch (error) {
    console.error('Error in adjustDisplayOrder:', error);
    throw error;
  }
}

// FAQ作成
export async function createFaq(input: FaqInput) {
  try {
    const supabase = createBrowserClient();

    // 同じ表示順のFAQが存在するかチェック
    const { data: existingFaq } = await supabase
      .from('mst_faq')
      .select('faq_id')
      .eq('display_order', input.display_order)
      .is('deleted_at', null)
      .single();

    // 重複がある場合は表示順を調整
    if (existingFaq) {
      await adjustDisplayOrder(input.display_order);
    }

    const { data, error } = await supabase
      .from('mst_faq')
      .insert({
        title: input.title,
        description: input.description,
        display_order: input.display_order,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating FAQ:', error);
      throw error;
    }

    return data as Faq;
  } catch (error) {
    console.error('Error in createFaq:', error);
    throw error;
  }
}

// FAQ更新
export async function updateFaq(faqId: string, input: FaqInput) {
  try {
    const supabase = createBrowserClient();

    // 現在のFAQの情報を取得
    const { data: currentFaq } = await supabase
      .from('mst_faq')
      .select('display_order')
      .eq('faq_id', faqId)
      .is('deleted_at', null)
      .single();

    // 表示順が変更される場合のみチェック
    if (currentFaq && currentFaq.display_order !== input.display_order) {
      // 同じ表示順のFAQが存在するかチェック（自分自身は除外）
      const { data: existingFaq } = await supabase
        .from('mst_faq')
        .select('faq_id')
        .eq('display_order', input.display_order)
        .neq('faq_id', faqId)
        .is('deleted_at', null)
        .single();

      // 重複がある場合は表示順を調整
      if (existingFaq) {
        await adjustDisplayOrder(input.display_order, faqId);
      }
    }

    const { data, error } = await supabase
      .from('mst_faq')
      .update({
        title: input.title,
        description: input.description,
        display_order: input.display_order,
      })
      .eq('faq_id', faqId)
      .select()
      .single();

    if (error) {
      console.error('Error updating FAQ:', error);
      throw error;
    }

    return data as Faq;
  } catch (error) {
    console.error('Error in updateFaq:', error);
    throw error;
  }
}

// FAQ削除（論理削除）
export async function deleteFaq(faqId: string) {
  try {
    const supabase = createBrowserClient();

    const { error } = await supabase
      .from('mst_faq')
      .update({ deleted_at: new Date().toISOString() })
      .eq('faq_id', faqId);

    if (error) {
      console.error('Error deleting FAQ:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteFaq:', error);
    throw error;
  }
}
