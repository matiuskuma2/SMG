'use server';

import { createClient } from '@/lib/supabase/server';
import type { Radio } from '@/types/radio';

export type GetRadiosParams = {
  page?: number;
  itemsPerPage?: number;
  searchQuery?: string;
  sortBy?: 'created_at' | 'radio_name';
  sortOrder?: 'asc' | 'desc';
};

export type GetRadiosResult = {
  radios: Radio[];
  totalCount: number;
};

export async function getRadiosAction(
  params: GetRadiosParams = {},
): Promise<GetRadiosResult> {
  const {
    page = 1,
    itemsPerPage = 10,
    searchQuery = '',
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = params;

  const supabase = createClient();

  try {
    // ベースクエリの構築
    let query = supabase
      .from('mst_radio')
      .select('*', { count: 'exact' })
      .is('deleted_at', null);

    // 検索条件の適用（radio_nameのみ）
    if (searchQuery) {
      query = query.ilike('radio_name', `%${searchQuery}%`);
    }

    // ソートの適用
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // ページネーションの適用
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to load radios:', error);
      throw error;
    }

    return {
      radios: data || [],
      totalCount: count ?? 0,
    };
  } catch (error) {
    console.error('Error in getRadiosAction:', error);
    return {
      radios: [],
      totalCount: 0,
    };
  }
}
