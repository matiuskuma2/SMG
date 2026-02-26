'use server';

import { createClient } from '@/lib/supabase/server';
import type { MstBeginnerGuideItem } from '@/lib/supabase/types';

export type ForBeginners = {
  guide_item_id: string;
  title: string;
  description: string | null;
  display_order: number | null;
  is_draft: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

export type GetForBeginnersParams = {
  page?: number;
  itemsPerPage?: number;
  searchQuery?: string;
  sortBy?: 'date' | 'title';
  sortOrder?: 'asc' | 'desc';
};

export type GetForBeginnersResult = {
  items: ForBeginners[];
  totalCount: number;
};

export async function getForBeginnersAction(
  params: GetForBeginnersParams = {},
): Promise<GetForBeginnersResult> {
  const {
    page = 1,
    itemsPerPage = 10,
    searchQuery = '',
    sortBy = 'date',
    sortOrder = 'asc',
  } = params;

  const supabase = createClient();

  try {
    // ベースクエリの構築
    let query = supabase
      .from('mst_beginner_guide_item')
      .select('*', { count: 'exact' })
      .is('deleted_at', null);

    // 検索条件の適用（titleとdescriptionで検索）
    if (searchQuery) {
      query = query.or(
        `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`,
      );
    }

    // ソートの適用
    if (sortBy === 'title') {
      query = query.order('title', { ascending: sortOrder === 'asc' });
    } else {
      // date
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    }

    // ページネーションの適用
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to load beginner guide items:', error);
      throw error;
    }

    const formattedData: ForBeginners[] =
      data?.map((item: MstBeginnerGuideItem) => ({
        guide_item_id: item.guide_item_id,
        title: item.title,
        description: item.description,
        display_order: item.display_order,
        is_draft: item.is_draft,
        created_at: item.created_at,
        updated_at: item.updated_at,
        deleted_at: item.deleted_at,
      })) || [];

    return {
      items: formattedData,
      totalCount: count ?? 0,
    };
  } catch (error) {
    console.error('Error in getForBeginnersAction:', error);
    return {
      items: [],
      totalCount: 0,
    };
  }
}
