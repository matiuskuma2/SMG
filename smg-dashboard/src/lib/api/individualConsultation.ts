'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  IndividualConsultationType,
  SupabaseConsultationData,
} from '@/types/individualConsultation';

export type GetIndividualConsultationsParams = {
  page?: number;
  itemsPerPage?: number;
  searchQuery?: string;
  sortBy?: 'createdDate' | 'applicationDate' | 'title';
  sortOrder?: 'asc' | 'desc';
};

export type GetIndividualConsultationsResult = {
  consultations: IndividualConsultationType[];
  totalCount: number;
};

export async function getIndividualConsultationsAction(
  params: GetIndividualConsultationsParams = {},
): Promise<GetIndividualConsultationsResult> {
  const {
    page = 1,
    itemsPerPage = 5,
    searchQuery = '',
    sortBy = 'createdDate',
    sortOrder = 'desc',
  } = params;

  const supabase = createClient();

  try {
    // ベースクエリの構築
    let query = supabase
      .from('mst_consultation')
      .select(
        `
        consultation_id,
        title,
        description,
        application_start_datetime,
        application_end_datetime,
        publish_start_at,
        publish_end_at,
        image_url,
        instructor_id,
        is_draft,
        created_at,
        updated_at,
        deleted_at,
        spreadsheet_id,
        mst_user (
          user_id,
          username
        ),
        mst_consultation_schedule(
          schedule_id,
          schedule_datetime
        ),
        applications_count:trn_consultation_application!inner(count)
      `,
        { count: 'exact' },
      )
      .is('deleted_at', null)
      .is('trn_consultation_application.deleted_at', null);

    // 検索条件の適用（titleとdescriptionで検索）
    if (searchQuery) {
      query = query.or(
        `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`,
      );
    }

    // ソートの適用
    if (sortBy === 'applicationDate') {
      query = query.order('application_start_datetime', {
        ascending: sortOrder === 'asc',
      });
    } else if (sortBy === 'title') {
      query = query.order('title', { ascending: sortOrder === 'asc' });
    } else {
      // createdDate
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    }

    // ページネーションの適用
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to load consultations:', error);
      throw error;
    }

    // データを整形
    const formattedData: IndividualConsultationType[] = (
      data as unknown as SupabaseConsultationData[]
    ).map((consultation) => {
      // applications_countの取得
      const applicationsCount = Array.isArray(consultation.applications_count)
        ? consultation.applications_count[0]?.count || 0
        : consultation.applications_count?.count || 0;

      return {
        consultation_id: consultation.consultation_id,
        title: consultation.title,
        image_url: consultation.image_url,
        application_start_datetime: consultation.application_start_datetime,
        application_end_datetime: consultation.application_end_datetime,
        publish_start_at: consultation.publish_start_at,
        publish_end_at: consultation.publish_end_at,
        description: consultation.description,
        instructor_id: consultation.instructor_id,
        instructorName: consultation.mst_user?.username || '不明',
        applicants: applicationsCount,
        created_at: consultation.created_at,
        updated_at: consultation.updated_at,
        deleted_at: consultation.deleted_at,
        is_draft: consultation.is_draft,
        spreadsheet_id: consultation.spreadsheet_id,
      };
    });

    return {
      consultations: formattedData,
      totalCount: count ?? 0,
    };
  } catch (error) {
    console.error('Error in getIndividualConsultationsAction:', error);
    return {
      consultations: [],
      totalCount: 0,
    };
  }
}
