'use server';

import { createClient } from '@/lib/supabase/server';
import type { MstEventArchive } from '@/lib/supabase/types';

export interface Archive extends MstEventArchive {
  event_name?: string;
  event_type_name?: string;
  archive_type_name?: string;
  file_count?: number;
  video_count?: number;
}

export type GetArchivesParams = {
  page?: number;
  itemsPerPage?: number;
  searchQuery?: string;
  sortBy?: 'createdDate' | 'publishDate' | 'title';
  sortOrder?: 'asc' | 'desc';
  combinedFilter?: string;
};

export type GetArchivesResult = {
  archives: Archive[];
  totalCount: number;
  eventTypes: { [key: string]: string };
  archiveTypes: { [key: string]: string };
};

export async function getArchivesAction(
  params: GetArchivesParams = {},
): Promise<GetArchivesResult> {
  const {
    page = 1,
    itemsPerPage = 10,
    searchQuery = '',
    sortBy = 'createdDate',
    sortOrder = 'desc',
    combinedFilter = 'all',
  } = params;

  const supabase = createClient();

  try {
    // イベントタイプの取得
    const { data: eventTypeData, error: eventTypeError } = await supabase
      .from('mst_event_type')
      .select('event_type_id, event_type_name')
      .is('deleted_at', null);

    if (eventTypeError) throw eventTypeError;

    const eventTypeMap = eventTypeData.reduce(
      (acc, type) => {
        acc[type.event_type_id] = type.event_type_name;
        return acc;
      },
      {} as { [key: string]: string },
    );

    // アーカイブタイプの取得
    const { data: archiveTypeData, error: archiveTypeError } = await supabase
      .from('mst_archive_type')
      .select('type_id, type_name')
      .is('deleted_at', null);

    if (archiveTypeError) {
      console.warn('Archive type data not available:', archiveTypeError);
    }

    const archiveTypeMap =
      archiveTypeData?.reduce(
        (acc, type) => {
          acc[type.type_id] = type.type_name;
          return acc;
        },
        {} as { [key: string]: string },
      ) || {};

    // ベースクエリの構築
    let query = supabase
      .from('mst_event_archive')
      .select(
        `
        *,
        mst_event(
          event_name,
          event_type
        )
      `,
        { count: 'exact' },
      )
      .is('deleted_at', null);

    // 検索条件の適用（title, event_name, event_type_name, archive_type_nameで検索）
    if (searchQuery) {
      // タイトルで検索
      query = query.ilike('title', `%${searchQuery}%`);
    }

    // フィルター条件の適用
    if (combinedFilter && combinedFilter !== 'all') {
      const [filterType, filterValue] = combinedFilter.split(':');

      if (filterType === 'event_type') {
        // イベントタイプでフィルター（イベント紐づきありのアーカイブのみ）
        const eventTypeId = Object.keys(eventTypeMap).find(
          (key) => eventTypeMap[key] === filterValue,
        );
        if (eventTypeId) {
          query = query
            .eq('event_type_id', eventTypeId)
            .not('event_id', 'is', null);
        }
      } else if (filterType === 'archive_type') {
        // アーカイブタイプでフィルター（イベント紐づきなしのアーカイブのみ）
        const archiveTypeId = Object.keys(archiveTypeMap).find(
          (key) => archiveTypeMap[key] === filterValue,
        );
        if (archiveTypeId) {
          query = query.eq('type_id', archiveTypeId).is('event_id', null);
        }
      }
    }

    // ソートの適用
    if (sortBy === 'publishDate') {
      query = query.order('publish_start_at', {
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
      console.error('Failed to load archives:', error);
      throw error;
    }

    // ファイルと動画の件数を取得
    const archiveIds = data?.map((archive) => archive.archive_id) || [];

    const [fileCountData, videoCountData] = await Promise.all([
      supabase
        .from('trn_event_archive_file')
        .select('archive_id')
        .in('archive_id', archiveIds)
        .is('deleted_at', null),
      supabase
        .from('trn_event_archive_video')
        .select('archive_id')
        .in('archive_id', archiveIds)
        .is('deleted_at', null),
    ]);

    if (fileCountData.error) throw fileCountData.error;
    if (videoCountData.error) throw videoCountData.error;

    // 各アーカイブのファイル・動画数をカウント
    const fileCounts = fileCountData.data.reduce(
      (acc, file) => {
        acc[file.archive_id] = (acc[file.archive_id] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number },
    );

    const videoCounts = videoCountData.data.reduce(
      (acc, video) => {
        acc[video.archive_id] = (acc[video.archive_id] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number },
    );

    // データをArchive型に変換
    const formattedArchives: Archive[] =
      data?.map((archive) => ({
        ...archive,
        event_name: archive.mst_event?.event_name || undefined,
        event_type_name: archive.mst_event
          ? eventTypeMap[archive.mst_event.event_type] || '未設定'
          : undefined,
        archive_type_name: !archive.event_id
          ? archive.type_id
            ? archiveTypeMap[archive.type_id] || '未設定'
            : '未設定'
          : undefined,
        file_count: fileCounts[archive.archive_id] || 0,
        video_count: videoCounts[archive.archive_id] || 0,
      })) || [];

    return {
      archives: formattedArchives,
      totalCount: count ?? 0,
      eventTypes: eventTypeMap,
      archiveTypes: archiveTypeMap,
    };
  } catch (error) {
    console.error('Error in getArchivesAction:', error);
    return {
      archives: [],
      totalCount: 0,
      eventTypes: {},
      archiveTypes: {},
    };
  }
}
