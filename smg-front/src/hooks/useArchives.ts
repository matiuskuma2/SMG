import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { PostgrestError } from '@supabase/supabase-js'
import { Archive } from '@/components/archive/types'

export const useArchives = (tabType?: 'regular' | 'bookkeeping' | 'online-seminar' | 'special-seminar' | 'five-cities' | 'photos' | 'newsletter' | 'sawabe-instructor', year?: string, sortOrder: 'newest' | 'oldest' = 'newest', page?: number, pageSize: number = 10, themeId?: string) => {
  const [archives, setArchives] = useState<Archive[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<PostgrestError | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const fetchArchives = async () => {
      const supabase = createClient()
      
      try {
        setLoading(true)
        
        // ログインユーザーのIDを取得
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;

        // ユーザーが所属するグループのIDを取得
        let userGroupIds: string[] = [];
        if (userId) {
          const { data: userGroups, error: userGroupError } = await supabase
            .from('trn_group_user')
            .select('group_id')
            .eq('user_id', userId)
            .is('deleted_at', null);

          if (userGroupError) {
            console.error('Error fetching user groups:', userGroupError);
          } else {
            userGroupIds = userGroups.map(ug => ug.group_id);
          }
        }
        
        // 現在時刻（UTC）を取得
        const nowUTC = new Date().toISOString()

        // タブタイプに応じて必要なIDを事前取得
        let targetEventTypeId: string | undefined;
        let targetArchiveTypeId: string | undefined;

        // 沢辺講師タブの場合は先にarchive_idを取得
        let sawabeArchiveIds: string[] = [];
        if (tabType === 'sawabe-instructor') {
          // クエリを構築
          let filesQuery = supabase
            .from('trn_event_archive_file')
            .select('archive_id')
            .eq('is_sawabe_instructor', true)
            .is('deleted_at', null);

          let videosQuery = supabase
            .from('trn_event_archive_video')
            .select('archive_id')
            .eq('is_sawabe_instructor', true)
            .is('deleted_at', null);

          // themeId が指定されている場合は追加でフィルタ
          if (themeId) {
            filesQuery = filesQuery.eq('theme_id', themeId);
            videosQuery = videosQuery.eq('theme_id', themeId);
          }

          const [filesData, videosData] = await Promise.all([
            filesQuery,
            videosQuery
          ]);

          const fileArchiveIds = filesData.data?.map(f => f.archive_id) || [];
          const videoArchiveIds = videosData.data?.map(v => v.archive_id) || [];
          sawabeArchiveIds = [...new Set([...fileArchiveIds, ...videoArchiveIds])];
        }

        if (tabType) {
          // イベント系タブの場合、イベントタイプIDを取得
          if (['regular', 'bookkeeping', 'online-seminar', 'special-seminar', 'five-cities'].includes(tabType)) {
            const eventTypeNameMap = {
              'regular': '定例会',
              'bookkeeping': '簿記講座',
              'online-seminar': 'オンラインセミナー',
              'special-seminar': '特別セミナー',
              'five-cities': '5大都市グループ相談会&交流会'
            };
            const eventTypeName = eventTypeNameMap[tabType as keyof typeof eventTypeNameMap];

            const { data: eventTypeData } = await supabase
              .from('mst_event_type')
              .select('event_type_id')
              .eq('event_type_name', eventTypeName)
              .is('deleted_at', null)
              .single();

            targetEventTypeId = eventTypeData?.event_type_id;
          }
          // アーカイブ系タブの場合、アーカイブタイプIDを取得
          else if (['photos', 'newsletter'].includes(tabType)) {
            const archiveTypeNameMap = {
              'photos': '写真',
              'newsletter': 'ニュースレター'
            };
            const archiveTypeName = archiveTypeNameMap[tabType as keyof typeof archiveTypeNameMap];

            const { data: archiveTypeData } = await supabase
              .from('mst_archive_type')
              .select('type_id')
              .eq('type_name', archiveTypeName)
              .is('deleted_at', null)
              .single();

            targetArchiveTypeId = archiveTypeData?.type_id;
          }
        }

        // 基本クエリ - 必要なフィールドのみ取得
        let query = supabase
          .from('mst_event_archive')
          .select(`
            archive_id,
            title,
            description,
            event_id,
            event_type_id,
            type_id,
            publish_start_at,
            publish_end_at,
            created_at,
            updated_at,
            image_url,
            mst_event!left(
              image_url,
              event_start_datetime,
              event_end_datetime
            ),
            mst_event_type!left(
              event_type_name
            ),
            mst_archive_type:type_id!left(
              type_name
            )
          `)
          .is('deleted_at', null)
          .eq('is_draft', false)
          .lte('publish_start_at', nowUTC)
          .or('publish_end_at.is.null,publish_end_at.gt.' + nowUTC)

        // タブタイプによる最適化されたフィルタリング
        if (targetEventTypeId) {
          // イベント系タブ: event_type_idで絞り込み、かつtype_idがnull（写真などのアーカイブタイプが設定されていないもの）
          query = query.eq('event_type_id', targetEventTypeId).is('type_id', null)
        } else if (targetArchiveTypeId) {
          // アーカイブ系タブ: event_idがnullで、type_idで絞り込み
          query = query.is('event_id', null).eq('type_id', targetArchiveTypeId)
        } else if (tabType === 'sawabe-instructor' && sawabeArchiveIds.length > 0) {
          // 沢辺講師タブ: 取得したarchive_idのリストで絞り込み
          query = query.in('archive_id', sawabeArchiveIds)
        } else if (tabType === 'sawabe-instructor' && sawabeArchiveIds.length === 0) {
          // 沢辺講師タブでarchive_idが0件の場合は空配列を返す
          setArchives([])
          setTotalCount(0)
          setLoading(false)
          return
        }

        // アーカイブデータを取得
        const { data: archiveData, error: archiveError } = await query
            
        if (archiveError) throw archiveError          
        
        // アーカイブのイベント表示制限をチェック
        let accessibleArchiveData = archiveData;
        let restrictedEventIds = new Set<string>();

        // 簿記講座タブの場合のみ、type_idと基本グループを取得
        let bookkeepingTypeId: string | undefined;
        let hasFullAccess = false;

        if (tabType === 'bookkeeping') {
          const { data: bookkeepingEventType } = await supabase
            .from('mst_event_type')
            .select('event_type_id')
            .eq('event_type_name', '簿記講座')
            .is('deleted_at', null)
            .single();

          bookkeepingTypeId = bookkeepingEventType?.event_type_id;

          // 簿記講座のグループ制限チェック（/bookkeepingページと同じロジック）
          if (userId && bookkeepingTypeId) {
            // 基本グループ（簿記3期、運営、講師）のIDを取得
            const { data: basicGroupData } = await supabase
              .from('mst_group')
              .select('group_id')
              .in('title', ['簿記3期', '運営', '講師'])
              .is('deleted_at', null);

            const basicGroupIds = basicGroupData?.map(g => g.group_id) || [];

            // ユーザーが基本グループ（簿記3期、運営、講師）に所属しているかチェック
            hasFullAccess = userGroupIds.some(groupId => basicGroupIds.includes(groupId));
          }
        }

        if (archiveData && archiveData.length > 0) {
          // 制限対象のイベントIDを一度に取得（最適化）
          const { data: restrictionData, error: restrictionError } = await supabase
            .from('trn_event_visible_group')
            .select('event_id, group_id')
            .is('deleted_at', null);

          if (restrictionError) {
            console.error('Error fetching restriction data:', restrictionError);
          }

          // すべての制限対象イベントID
          restrictedEventIds = new Set(restrictionData?.map(r => r.event_id) || []);

          // ユーザーが表示可能なイベントID（JavaScriptでフィルタリング）
          let visibleEventIds: string[] = [];
          if (userGroupIds.length > 0 && restrictionData) {
            visibleEventIds = restrictionData
              .filter(r => userGroupIds.includes(r.group_id))
              .map(r => r.event_id);
          }

          // アーカイブ表示制限データを取得（写真・ニュースレター用）
          const { data: archiveRestrictionData, error: archiveRestrictionError } = await supabase
            .from('trn_event_archive_visible_group')
            .select('archive_id, group_id')
            .is('deleted_at', null);

          if (archiveRestrictionError) {
            console.error('Error fetching archive restriction data:', archiveRestrictionError);
          }

          // すべての制限対象アーカイブID
          const restrictedArchiveIds = new Set(archiveRestrictionData?.map(r => r.archive_id) || []);

          // ユーザーが表示可能なアーカイブID（JavaScriptでフィルタリング）
          let visibleArchiveIds: string[] = [];
          if (userGroupIds.length > 0 && archiveRestrictionData) {
            visibleArchiveIds = archiveRestrictionData
              .filter(r => userGroupIds.includes(r.group_id))
              .map(r => r.archive_id);
          }

          // アーカイブをフィルタリング
          accessibleArchiveData = archiveData.filter(archive => {
            // event_idがnullの場合（写真・ニュースレター）
            if (!archive.event_id) {
              // アーカイブ制限がない場合は表示
              if (!restrictedArchiveIds.has(archive.archive_id)) {
                return true;
              }
              // 制限があるアーカイブの場合、ユーザーのグループで表示可能かチェック
              return visibleArchiveIds.includes(archive.archive_id);
            }

            // event_idがある場合（イベント連動アーカイブ）
            // 簿記講座の場合の特別処理
            if (bookkeepingTypeId && archive.event_type_id === bookkeepingTypeId) {
              if (hasFullAccess) {
                // 基本グループ（簿記3期、運営、講師）に所属している場合はすべて表示
                return true;
              } else {
                // 基本グループに所属していない場合は、制限があるイベントのみ表示
                return restrictedEventIds.has(archive.event_id) && visibleEventIds.includes(archive.event_id);
              }
            }

            // その他のイベントタイプの場合
            // イベントに制限がない場合は表示
            if (!restrictedEventIds.has(archive.event_id)) {
              return true;
            }

            // 制限があるイベントの場合、ユーザーのグループで表示可能かチェック
            return visibleEventIds.includes(archive.event_id);
          });
        }

        // 年でフィルタリング（必要な場合）
        let filteredData = year
          ? accessibleArchiveData.filter(archive => {
              // event_start_datetimeを優先、nullの場合はcreated_atを使用
              let targetDate: Date | null = null;
              if (archive.mst_event?.event_start_datetime) {
                targetDate = new Date(archive.mst_event.event_start_datetime);
              } else if (archive.created_at) {
                targetDate = new Date(archive.created_at);
              }
              return targetDate && targetDate.getFullYear().toString() === year;
            })
          : accessibleArchiveData


        // enrichedDataの各要素に「sortDate」プロパティを付与
        const dataWithSortDate = filteredData.map(item => {
          let sortDate: number = 0;
          if (item.mst_event?.event_start_datetime) {
            sortDate = new Date(item.mst_event.event_start_datetime).getTime();
          } else if (item.created_at) {
            sortDate = new Date(item.created_at).getTime();
          }
          return { ...item, sortDate };
        });

        // sortDateでソート
        const sortedData = dataWithSortDate.sort((a, b) => {
          if (sortOrder === 'newest') {
            return b.sortDate - a.sortDate; // 降順（新しい順）
          } else {
            return a.sortDate - b.sortDate; // 昇順（古い順）
          }
        });

        // 総件数を設定
        setTotalCount(sortedData.length);
        
        // ページネーション適用
        let paginatedData = sortedData;
        if (page !== undefined) {
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          paginatedData = sortedData.slice(startIndex, endIndex);
        }

        // ページネーション後のarchive_idのみでファイル・動画を取得
        const paginatedArchiveIds = paginatedData.map(archive => archive.archive_id);

        // 沢辺講師タブの場合はis_sawabe_instructor = trueのみ取得
        let filesQuery = supabase
          .from('trn_event_archive_file')
          .select('archive_id, file_id, file_url, display_order, is_sawabe_instructor')
          .in('archive_id', paginatedArchiveIds)
          .is('deleted_at', null)
          .order('display_order', { ascending: true });

        let videosQuery = supabase
          .from('trn_event_archive_video')
          .select('archive_id, video_id, video_url, display_order, is_sawabe_instructor')
          .in('archive_id', paginatedArchiveIds)
          .is('deleted_at', null)
          .order('display_order', { ascending: true });

        if (tabType === 'sawabe-instructor') {
          filesQuery = filesQuery.eq('is_sawabe_instructor', true);
          videosQuery = videosQuery.eq('is_sawabe_instructor', true);
        }

        const [paginatedFiles, paginatedVideos] = await Promise.all([
          filesQuery,
          videosQuery
        ]);

        // ファイルとビデオをアーカイブごとにグループ化
        const paginatedFilesMap = new Map<string, typeof paginatedFiles.data>();
        const paginatedVideosMap = new Map<string, typeof paginatedVideos.data>();

        if (paginatedFiles.data) {
          paginatedFiles.data.forEach(file => {
            if (!paginatedFilesMap.has(file.archive_id)) {
              paginatedFilesMap.set(file.archive_id, []);
            }
            paginatedFilesMap.get(file.archive_id)!.push(file);
          });
        }

        if (paginatedVideos.data) {
          paginatedVideos.data.forEach(video => {
            if (!paginatedVideosMap.has(video.archive_id)) {
              paginatedVideosMap.set(video.archive_id, []);
            }
            paginatedVideosMap.get(video.archive_id)!.push(video);
          });
        }

        // sortDateを除去してアーカイブデータを設定
        const finalData = paginatedData.map(({ sortDate, ...archive }) => ({
          ...archive,
          archive_image_url: archive.image_url || null,
          image_url: archive.mst_event?.image_url || null,
          event_type_name: tabType && ['photos', 'newsletter'].includes(tabType) && archive.mst_archive_type?.type_name
            ? archive.mst_archive_type.type_name
            : archive.mst_event_type?.event_type_name || '',
          event_start_datetime: archive.mst_event?.event_start_datetime || null,
          event_end_datetime: archive.mst_event?.event_end_datetime || null,
          files: (paginatedFilesMap.get(archive.archive_id) || []).map(file => ({
            file_id: file.file_id,
            file_url: file.file_url,
            display_order: file.display_order,
            is_sawabe_instructor: file.is_sawabe_instructor ?? undefined,
          })),
          videos: (paginatedVideosMap.get(archive.archive_id) || []).map(video => ({
            video_id: video.video_id,
            video_url: video.video_url,
            display_order: video.display_order,
            is_sawabe_instructor: video.is_sawabe_instructor ?? undefined,
          })),
          mst_event: undefined,
          mst_event_type: undefined,
          mst_archive_type: undefined
        }));
        
        setArchives(finalData)
      } catch (error) {
        setError(error as PostgrestError)
        console.error('Error fetching archives:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchArchives()
  }, [tabType, year, sortOrder, page, pageSize, themeId])

  return { archives, loading, error, totalCount }
} 