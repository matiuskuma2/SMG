'use client';

import { EventForm } from '@/components/event/EventForm';
import type { EventFile, EventFormData } from '@/components/event/types';
import { createClient } from '@/lib/supabase/client';
import { jstToUtc, utcToJst } from '@/utils/date';
import { getReturnQuery } from '@/utils/navigation';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EventEditPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = params.eventid as string;
  const supabase = createClient();

  // ステート定義
  const [event, setEvent] = useState<EventFormData | null>(null);
  const [loading, setLoading] = useState(true);

  // リストページに戻る際のURL（クエリパラメータを保持）
  const getReturnUrl = () => {
    const returnQuery = getReturnQuery(searchParams);
    return returnQuery ? `/eventlist?${returnQuery}` : '/eventlist';
  };

  // イベントデータの取得
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        // 開催区分のデータを取得
        const { data: eventTypeData, error: eventTypeError } = await supabase
          .from('mst_event_type')
          .select('event_type_id, event_type_name')
          .is('deleted_at', null);

        if (eventTypeError) throw eventTypeError;

        console.log(
          'イベント編集ページ - 取得した開催区分データ:',
          eventTypeData,
        );

        // イベントデータの取得
        const { data, error } = await supabase
          .from('mst_event')
          .select('*')
          .eq('event_id', eventId)
          .is('deleted_at', null)
          .single();

        if (error) throw error;

        console.log('イベント編集ページ - 取得したイベントデータ:', data);
        console.log(
          'イベント編集ページ - イベントのevent_type:',
          data.event_type,
        );

        // イベントファイルを取得
        const { data: fileData, error: fileError } = await supabase
          .from('mst_event_file')
          .select('*')
          .eq('event_id', eventId)
          .is('deleted_at', null)
          .order('display_order');

        if (fileError) throw fileError;

        console.log('イベント編集ページ - 取得したファイルデータ:', fileData);

        // イベントのグループデータを取得
        const { data: groupData, error: groupError } = await supabase
          .from('trn_event_visible_group')
          .select('group_id')
          .eq('event_id', eventId)
          .is('deleted_at', null);

        if (groupError) throw groupError;

        console.log('イベント編集ページ - 取得したグループデータ:', groupData);

        // グループIDの配列を作成
        const selectedGroupIds = groupData
          ? groupData.map((g: { group_id: string }) => g.group_id)
          : [];

        // ファイルデータをEventFile型に変換
        const eventFiles: EventFile[] = fileData
          ? fileData.map((file) => ({
              file_id: file.file_id,
              event_id: eventId,
              file_url: file.file_url,
              file_name: file.file_name,
              file_description: file.file_description,
              display_order: file.display_order,
              created_at: file.created_at,
              updated_at: file.updated_at,
              deleted_at: file.deleted_at,
              file: null,
              isNew: false,
            }))
          : [];

        if (data) {
          // イベントタイプIDから対応する値を取得
          const eventTypeValue = data.event_type || undefined;
          console.log(
            'イベント編集ページ - 処理後のeventTypeValue:',
            eventTypeValue,
          );

          // Supabaseから取得したデータをEventFormData型に変換
          // 日時データをUTCから日本時間に変換
          setEvent({
            event_id: data.event_id,
            event_name: data.event_name || '',
            image_url: data.image_url || null,
            publish_start_at: data.publish_start_at
              ? utcToJst(data.publish_start_at)
              : null,
            publish_end_at: data.publish_end_at
              ? utcToJst(data.publish_end_at)
              : null,
            event_start_datetime: utcToJst(data.event_start_datetime),
            event_end_datetime: utcToJst(data.event_end_datetime),
            registration_start_datetime: utcToJst(
              data.registration_start_datetime,
            ),
            registration_end_datetime: utcToJst(data.registration_end_datetime),
            event_location: data.event_location || '',
            event_city: data.event_city || '',
            event_capacity: data.event_capacity || 0,
            event_type: eventTypeValue,
            event_description: data.event_description || '',
            visible_group_ids: selectedGroupIds,
            gather_start_time: data.gather_start_time
              ? utcToJst(data.gather_start_time)
              : null,
            gather_end_time: data.gather_end_time
              ? utcToJst(data.gather_end_time)
              : null,
            gather_location: data.gather_location || null,
            gather_price: data.gather_price || null,
            gather_capacity: data.gather_capacity || null,
            gather_registration_end_datetime: data.gather_registration_end_datetime
              ? utcToJst(data.gather_registration_end_datetime)
              : null,
            consultation_capacity: data.consultation_capacity || null,
            has_gather:
              !!data.gather_start_time &&
              !!data.gather_end_time &&
              !!data.gather_location,
            has_consultation: !!data.consultation_capacity,
            files: eventFiles,
          });
        }
      } catch (error) {
        console.error('イベントデータの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, supabase]);

  const handleSubmit = async (data: EventFormData, isDraft = false) => {
    try {
      console.log('イベント更新開始:', {
        event_id: eventId,
        questions: data.questions,
        questionsCount: data.questions?.length || 0,
        isDraft,
        data: {
          event_name: data.event_name,
          event_start_datetime: data.event_start_datetime,
          event_end_datetime: data.event_end_datetime,
          registration_start_datetime: data.registration_start_datetime,
          registration_end_datetime: data.registration_end_datetime,
          event_location: data.event_location,
          event_city: data.event_city,
          event_capacity: data.event_capacity,
          event_type: data.event_type,
          event_description: data.event_description,
          image_url: data.image_url,
        },
      });

      // 日本時間をUTCに変換してSupabaseに保存
      const { error } = await supabase
        .from('mst_event')
        .update({
          event_name: data.event_name || '',
          image_url: typeof data.image_url === 'string' ? data.image_url : null,
          event_start_datetime: jstToUtc(data.event_start_datetime || ''),
          event_end_datetime: jstToUtc(data.event_end_datetime || ''),
          registration_start_datetime: jstToUtc(
            data.registration_start_datetime || '',
          ),
          registration_end_datetime: jstToUtc(
            data.registration_end_datetime || '',
          ),
          event_location: data.event_location || '',
          event_city: data.event_city || '',
          event_capacity: data.event_capacity || 0,
          event_description: data.event_description || '',
          event_type: data.event_type || undefined,
          has_gather:
            !!data.gather_start_time &&
            !!data.gather_end_time &&
            !!data.gather_location,
          gather_start_time: data.gather_start_time
            ? jstToUtc(data.gather_start_time)
            : null,
          gather_end_time: data.gather_end_time
            ? jstToUtc(data.gather_end_time)
            : null,
          gather_location: data.gather_location || null,
          gather_price: data.gather_price || null,
          gather_capacity: data.gather_capacity || null,
          gather_registration_end_datetime: data.gather_registration_end_datetime
            ? jstToUtc(data.gather_registration_end_datetime)
            : null,
          has_consultation: !!data.consultation_capacity,
          consultation_capacity: data.consultation_capacity || null,
          publish_start_at: data.publish_start_at
            ? jstToUtc(data.publish_start_at)
            : null,
          publish_end_at: data.publish_end_at
            ? jstToUtc(data.publish_end_at)
            : null,
          is_draft: isDraft,
          updated_at: new Date().toISOString(),
        })
        .eq('event_id', eventId);

      if (error) {
        console.error('イベント更新エラー:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          data: {
            event_id: eventId,
            event_name: data.event_name,
            event_type: data.event_type,
          },
        });
        throw error;
      }

      // 画像がBase64データの場合、Storageにアップロード
      if (
        typeof data.image_url === 'string' &&
        data.image_url.startsWith('data:')
      ) {
        try {
          const res = await fetch(data.image_url);
          const blob = await res.blob();
          const file = new File([blob], `image_${Date.now()}.jpg`, {
            type: blob.type,
          });

          const fileExt = file.name.split('.').pop();
          const filePath = `event_image/${eventId}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('event')
            .upload(filePath, file, { upsert: true });

          if (uploadError) throw uploadError;

          // 画像URLを取得してイベントレコードを更新
          const { data: urlData } = supabase.storage
            .from('event')
            .getPublicUrl(filePath);

          if (urlData) {
            await supabase
              .from('mst_event')
              .update({ image_url: urlData.publicUrl })
              .eq('event_id', eventId);
          }
        } catch (e) {
          console.error('画像アップロードエラー:', e);
        }
      }

      // ファイルを保存（あれば）
      if (data.files && data.files.length > 0) {
        // 既存のファイルを削除
        await supabase
          .from('mst_event_file')
          .update({ deleted_at: new Date().toISOString() })
          .eq('event_id', eventId);

        // 新しいファイルを保存
        for (const file of data.files) {
          let fileUrl = file.file_url;

          // 新しいファイルがアップロードされた場合
          if (file.file) {
            const fileExt = file.file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `event_file/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('event_file')
              .upload(filePath, file.file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
              .from('event_file')
              .getPublicUrl(filePath);

            if (urlData) {
              fileUrl = urlData.publicUrl;
            }
          }

          if (fileUrl) {
            const fileData = {
              event_id: eventId,
              file_description: file.file_description,
              file_name: file.file_name ?? file.file?.name ?? '',
              file_url: fileUrl,
              display_order: file.display_order,
            };

            // 既存のファイルがある場合は更新、なければ挿入
            if (file.file_id && !file.file_id.startsWith('temp-')) {
              await supabase
                .from('mst_event_file')
                .update({
                  ...fileData,
                  updated_at: new Date().toISOString(),
                  deleted_at: null,
                })
                .eq('file_id', file.file_id);
            } else {
              await supabase.from('mst_event_file').insert([fileData]);
            }
          }
        }
      }

      // グループの関連データを更新
      console.log('イベント更新 - グループデータ処理開始:', {
        eventId,
        visible_group_ids: data.visible_group_ids,
        length: data.visible_group_ids?.length,
      });

      if (data.visible_group_ids) {
        // 既存のグループ関連データを削除
        await supabase
          .from('trn_event_visible_group')
          .update({ deleted_at: new Date().toISOString() })
          .eq('event_id', eventId);

        // 新しいグループ関連データを挿入
        if (data.visible_group_ids.length > 0) {
          const groupData = data.visible_group_ids.map((groupId: string) => ({
            event_id: eventId,
            group_id: groupId,
          }));

          console.log('グループデータ挿入準備:', groupData);

          const { error: groupError, data: insertResult } = await supabase
            .from('trn_event_visible_group')
            .insert(groupData);

          if (groupError) {
            console.error('グループ関連データの保存に失敗:', groupError);
            throw groupError;
          }
          console.log('グループデータ挿入成功:', insertResult);
        } else {
          console.log('グループが選択されていないため、挿入をスキップ');
        }
      }

      // 成功時に一覧画面に遷移
      router.push(getReturnUrl());
    } catch (error) {
      console.error('イベント更新に失敗しました:', error);
    }
  };

  const handleCancel = () => {
    // 前のページに戻る
    router.push(getReturnUrl());
  };

  if (loading) {
    return <div className="p-6 text-center">読み込み中...</div>;
  }

  if (!event) {
    return (
      <div className="p-6 text-center">イベントが見つかりませんでした</div>
    );
  }

  return (
    <EventForm
      isEditing={true}
      initialData={event}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
