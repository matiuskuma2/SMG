'use client';

import { IndividualConsultationForm } from '@/components/individualConsultation/IndividualConsultationForm';
import { revalidateIndividualConsultation } from '@/lib/api/revalidate';
import { compressImage } from '@/lib/imageCompression';
import { createClient } from '@/lib/supabase/client';
import type {
  ConsultationQuestionFormType,
  IndividualConsultationFormType,
} from '@/types/individualConsultation';
import type { SupabaseConsultationData } from '@/types/individualConsultation';
import { getReturnQuery } from '@/utils/navigation';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// ISO形式の日付文字列をinput[type="datetime-local"]用に変換する関数
function formatDateForInput(
  isoString: string | null | undefined,
): string | undefined {
  if (!isoString) return undefined;
  try {
    // ISO形式の日付文字列からDateオブジェクトを作成
    const date = new Date(isoString);
    // 日本時間に変換（UTC+9）
    const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    // YYYY-MM-DDThh:mm形式に変換
    return jstDate.toISOString().slice(0, 16);
  } catch (e) {
    console.error('日付変換エラー:', e);
    return undefined;
  }
}

export default function IndividualConsultationEditPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const individualConsultationId = params.individualConsultationId as string;

  // ステート定義
  const [individualConsultation, setIndividualConsultation] =
    useState<IndividualConsultationFormType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // リストページに戻る際のURL（クエリパラメータを保持）
  const getReturnUrl = () => {
    const returnQuery = getReturnQuery(searchParams);
    return returnQuery
      ? `/individualConsultationlist?${returnQuery}`
      : '/individualConsultationlist';
  };

  // 個別相談データの取得
  useEffect(() => {
    const fetchIndividualConsultation = async () => {
      try {
        setLoading(true);
        setError(null);

        // Supabaseから個別相談データを取得
        const { data: consultation, error: consultationError } = await supabase
          .from('mst_consultation')
          .select(`
            consultation_id,
            title,
            description,
            application_start_datetime,
            application_end_datetime,
            publish_start_at,
            publish_end_at,
            image_url,
            instructor_id,
            mst_user (
              user_id,
              username
            )
          `)
          .eq('consultation_id', individualConsultationId)
          .is('deleted_at', null)
          .single();

        if (consultationError) {
          throw new Error('個別相談データの取得に失敗しました');
        }

        // スケジュール情報を取得
        const { data: schedules, error: schedulesError } = await supabase
          .from('mst_consultation_schedule')
          .select('schedule_id, schedule_datetime')
          .eq('consultation_id', individualConsultationId)
          .is('deleted_at', null)
          .order('schedule_datetime', { ascending: true });

        if (schedulesError) {
          throw new Error('スケジュールデータの取得に失敗しました');
        }

        // フォーム用にデータを整形
        const consultationData =
          consultation as unknown as SupabaseConsultationData;
        const formattedData: IndividualConsultationFormType = {
          consultation_id: consultationData.consultation_id,
          title: consultationData.title,
          description: consultationData.description,
          image_url: consultationData.image_url,
          application_start_datetime: formatDateForInput(
            consultationData.application_start_datetime,
          ),
          application_end_datetime: formatDateForInput(
            consultationData.application_end_datetime,
          ),
          publish_start_at: formatDateForInput(
            consultationData.publish_start_at,
          ),
          publish_end_at: formatDateForInput(consultationData.publish_end_at),
          instructor_id: consultationData.instructor_id,
          schedule_datetime:
            schedules
              ?.map((schedule) =>
                formatDateForInput(schedule.schedule_datetime),
              )
              .filter((date): date is string => date !== undefined) || [],
        };
        setIndividualConsultation(formattedData);
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError(
          err instanceof Error
            ? err.message
            : '個別相談データの取得に失敗しました',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchIndividualConsultation();
  }, [supabase, individualConsultationId]);

  const handleSubmit = async (
    data: IndividualConsultationFormType & {
      questions?: ConsultationQuestionFormType[];
    },
    isDraft = false,
  ) => {
    try {
      setLoading(true);
      setError(null);

      let imageUrl = null;

      // サムネイル画像がFileオブジェクトの場合、Supabaseにアップロード
      if (data.image_url && typeof data.image_url !== 'string') {
        try {
          // 画像を圧縮
          const thumbnail = data.image_url as File;
          const compressResult = await compressImage(thumbnail, 85, 1200);
          const file = compressResult.file;

          // Supabaseのストレージにアップロード
          const fileExt = file.name.split('.').pop();
          const filePath = `online_consultation_image/${Date.now()}.${fileExt}`;

          // 古い画像を削除（編集時）
          if (
            individualConsultation?.image_url &&
            typeof individualConsultation.image_url === 'string'
          ) {
            const oldImagePath = individualConsultation.image_url
              .split('/')
              .pop();
            if (oldImagePath) {
              await supabase.storage
                .from('online_consultation')
                .remove([`online_consultation_image/${oldImagePath}`]);
            }
          }

          const { error: uploadError } = await supabase.storage
            .from('online_consultation')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.error('画像アップロードエラー:', uploadError);
            throw new Error(
              `画像のアップロードに失敗しました: ${uploadError.message}`,
            );
          }

          // 画像URLを取得
          const { data: urlData } = supabase.storage
            .from('online_consultation')
            .getPublicUrl(filePath);

          imageUrl = urlData.publicUrl;
        } catch (err) {
          console.error('画像処理エラー:', err);
          throw new Error('画像の処理中にエラーが発生しました');
        }
      } else if (typeof data.image_url === 'string' && data.image_url) {
        // すでに画像URLが文字列として存在する場合はそのまま使用
        imageUrl = data.image_url;
      }

      // APIにデータを送信して更新
      console.log('送信するデータ:', {
        consultationId: individualConsultationId,
        title: data.title,
        description: data.description,
        application_start_datetime: data.application_start_datetime,
        application_end_datetime: data.application_end_datetime,
        publish_start_at: data.publish_start_at,
        publish_end_at: data.publish_end_at,
        instructor_id: data.instructor_id,
        image_url: imageUrl,
        schedule_datetime: data.schedule_datetime,
      });

      const response = await fetch('/api/individualConsultation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultationId: individualConsultationId,
          title: data.title,
          description: data.description,
          application_start_datetime: data.application_start_datetime,
          application_end_datetime: data.application_end_datetime,
          publish_start_at: data.publish_start_at,
          publish_end_at: data.publish_end_at,
          instructor_id: data.instructor_id,
          image_url: imageUrl,
          schedule_datetime: data.schedule_datetime,
          is_draft: isDraft,
          questions: data.questions || [], // 質問データを追加
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '個別相談会の更新に失敗しました');
      }

      // キャッシュを再検証
      await revalidateIndividualConsultation();

      // 成功時に一覧画面に遷移
      router.push(getReturnUrl());
    } catch (err) {
      console.error('エラー:', err);
      setError(
        err instanceof Error ? err.message : '予期せぬエラーが発生しました',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // 前のページに戻る
    router.push(getReturnUrl());
  };

  if (loading) {
    return <div className="p-6 text-center">読み込み中...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  if (!individualConsultation) {
    return (
      <div className="p-6 text-center">個別相談が見つかりませんでした</div>
    );
  }

  return (
    <>
      <IndividualConsultationForm
        isEditing={true}
        initialData={individualConsultation}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg">
            <p className="text-lg">処理中...</p>
          </div>
        </div>
      )}
    </>
  );
}
