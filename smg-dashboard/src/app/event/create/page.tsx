'use client';

import { EventForm } from '@/components/event/EventForm';
import { EventTemplateSelector } from '@/components/event/EventTemplateSelector';
import type {
  EventFile,
  EventFormData,
  EventQuestionFormType,
} from '@/components/event/types';
import { createClient } from '@/lib/supabase/client';
import { jstToUtc, utcToJst } from '@/utils/date';
import { Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function EventCreatePage() {
  const router = useRouter();
  const supabase = createClient();
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templateData, setTemplateData] =
    useState<Partial<EventFormData> | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [formKey, setFormKey] = useState(0); // フォーム再マウント用

  // テンプレート選択処理
  const handleTemplateSelect = async (eventId: string) => {
    setIsLoadingTemplate(true);
    try {
      // APIでテンプレートデータ取得
      const response = await fetch('/api/event-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      });

      if (!response.ok) throw new Error('テンプレート取得に失敗しました');

      const { event, files, questions, groups } = await response.json();

      // 日時フォーマット変換関数（datetime-local用）
      const formatForDatetimeLocal = (
        dateString: string | null,
      ): string | undefined => {
        if (!dateString) return undefined;
        // YYYY-MM-DDTHH:mm:ss → YYYY-MM-DDTHH:mm
        return dateString.slice(0, 16);
      };

      // ファイルデータの変換
      const templateFiles: EventFile[] = files.map(
        (file: {
          file_description: string;
          file_name: string;
          file_url: string;
          display_order: number;
        }) => ({
          ...file,
          file: null,
          isNew: false,
        }),
      );

      // 質問データの変換
      const templateQuestions: EventQuestionFormType[] = questions.map(
        (q: {
          title: string;
          question_type: string;
          is_required: boolean;
          display_order: number;
          options: string[] | null;
        }) => ({
          title: q.title,
          question_type: q.question_type,
          is_required: q.is_required,
          display_order: q.display_order,
          options: q.options || [],
        }),
      );

      // グループIDの抽出
      const groupIds = groups.map((g: { group_id: string }) => g.group_id);

      // テンプレートデータを設定（日時もコピー、datetime-local形式に変換）
      const newTemplateData: Partial<EventFormData> = {
        event_name: `${event.event_name} (コピー)`,
        event_location: event.event_location,
        event_city: event.event_city,
        event_capacity: event.event_capacity,
        event_type: event.event_type,
        event_description: event.event_description,
        image_url: event.image_url, // プレビュー用（再選択推奨）
        // イベント日時フィールドもコピー（datetime-local形式に変換）
        event_start_datetime: event.event_start_datetime
          ? formatForDatetimeLocal(utcToJst(event.event_start_datetime))
          : undefined,
        event_end_datetime: event.event_end_datetime
          ? formatForDatetimeLocal(utcToJst(event.event_end_datetime))
          : undefined,
        registration_start_datetime: event.registration_start_datetime
          ? formatForDatetimeLocal(utcToJst(event.registration_start_datetime))
          : undefined,
        registration_end_datetime: event.registration_end_datetime
          ? formatForDatetimeLocal(utcToJst(event.registration_end_datetime))
          : undefined,
        publish_start_at: event.publish_start_at
          ? formatForDatetimeLocal(utcToJst(event.publish_start_at))
          : undefined,
        publish_end_at: event.publish_end_at
          ? formatForDatetimeLocal(utcToJst(event.publish_end_at))
          : undefined,
        // 懇親会設定（時刻はコピー、datetime-local形式に変換）
        gather_start_time: event.gather_start_time
          ? formatForDatetimeLocal(utcToJst(event.gather_start_time))
          : undefined,
        gather_end_time: event.gather_end_time
          ? formatForDatetimeLocal(utcToJst(event.gather_end_time))
          : undefined,
        gather_location: event.gather_location,
        gather_price: event.gather_price,
        gather_capacity: event.gather_capacity,
        gather_registration_end_datetime: event.gather_registration_end_datetime
          ? formatForDatetimeLocal(utcToJst(event.gather_registration_end_datetime))
          : undefined,
        has_gather: event.has_gather,
        // 個別相談会設定
        consultation_capacity: event.consultation_capacity,
        has_consultation: event.has_consultation,
        // ファイル・質問・グループ
        files: templateFiles,
        questions: templateQuestions,
        visible_group_ids: groupIds,
      };

      setTemplateData(newTemplateData);

      // フォームを再マウントさせる
      setFormKey((prev) => prev + 1);
      setShowTemplateSelector(false);
    } catch (error) {
      console.error('テンプレート読込エラー:', error);
      alert('テンプレートの読み込みに失敗しました');
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const handleSubmit = async (data: EventFormData, isDraft = false) => {
    try {
      console.log('イベント作成開始: 受け取ったデータ', {
        event_name: data.event_name,
        image_url: data.image_url,
        imageType: data.image_url ? typeof data.image_url : 'なし',
        questions: data.questions,
        questionsCount: data.questions?.length || 0,
        isDraft,
      });

      // 新規イベントIDの生成
      const eventId = uuidv4();
      console.log('新規イベントID:', eventId);

      // 画像処理 - 完全に独立した関数として実装
      async function processImage() {
        // Base64データの場合はFileオブジェクトに変換
        if (
          typeof data.image_url === 'string' &&
          data.image_url.startsWith('data:')
        ) {
          console.log('Base64画像データを検出。Fileオブジェクトに変換します');
          try {
            const res = await fetch(data.image_url);
            const blob = await res.blob();
            const file = new File([blob], `image_${Date.now()}.jpg`, {
              type: blob.type,
            });
            // 一時的な変数に保存
            const tempFile = file;
            console.log(
              'Base64をFileオブジェクトに変換しました:',
              tempFile.name,
            );

            // ファイルをアップロードしてURLを取得
            const fileExt = tempFile.name.split('.').pop();
            const filePath = `event_image/${eventId}.${fileExt}`;

            console.log('画像アップロード開始:', {
              eventId,
              filePath,
              fileName: tempFile.name,
            });

            const { error: uploadError } = await supabase.storage
              .from('event')
              .upload(filePath, tempFile, { upsert: true });

            if (uploadError) {
              console.error('画像アップロードエラー:', uploadError);
              return null;
            }

            const { data: urlData } = await supabase.storage
              .from('event')
              .getPublicUrl(filePath);

            if (!urlData || !urlData.publicUrl) {
              console.error('画像URL取得失敗:', urlData);
              return null;
            }

            return urlData.publicUrl;
          } catch (e) {
            console.error('Base64からFileへの変換エラー:', e);
            return null;
          }
        }

        // 画像URLが既にSupabaseのバケットURLの場合はそのまま使用
        if (
          typeof data.image_url === 'string' &&
          data.image_url.startsWith('http')
        ) {
          console.log('既存の画像URL:', data.image_url);
          return data.image_url;
        }

        console.log('アップロードする画像なし:', data.image_url);
        return null;
      }

      // 画像処理を実行して結果を待つ
      const imageUrl = await processImage();
      console.log('最終的な画像URL:', imageUrl);

      // イベントの基本データを作成
      const basicEventData = {
        event_id: eventId,
        event_name: data.event_name || '',
        image_url: imageUrl,
        event_start_datetime: jstToUtc(data.event_start_datetime || ''),
        event_end_datetime: jstToUtc(data.event_end_datetime || ''),
        registration_start_datetime: jstToUtc(
          data.registration_start_datetime || '',
        ),
        registration_end_datetime: jstToUtc(
          data.registration_end_datetime || '',
        ),
        event_location: data.event_location || '',
        event_city: data.event_city,
        event_capacity: data.event_capacity || 0,
        event_description: data.event_description,
        event_type: data.event_type || '',
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('イベント作成開始:', {
        event_id: basicEventData.event_id,
        event_name: basicEventData.event_name,
        image_url: basicEventData.image_url,
      });

      // ステップ1: 基本イベントデータを保存
      const { error: createError, data: createdEvent } = await supabase
        .from('mst_event')
        .insert(basicEventData)
        .select();

      if (createError) {
        console.error('イベント作成エラー:', createError);
        throw createError;
      }

      console.log('イベント作成成功:', createdEvent);

      // バックアップ: 画像URLがあるのに保存されていない場合
      if (
        imageUrl &&
        (!createdEvent ||
          !createdEvent[0] ||
          createdEvent[0].image_url !== imageUrl)
      ) {
        console.log('バックアップ: image_url更新処理開始:', {
          eventId,
          imageUrl,
        });

        const { error: updateError, data: updatedEvent } = await supabase
          .from('mst_event')
          .update({ image_url: imageUrl })
          .eq('event_id', eventId)
          .select();

        if (updateError) {
          console.error('画像URL更新エラー:', updateError);
        } else {
          console.log('画像URL更新成功:', updatedEvent);
        }
      }

      // 新しいファイルを保存
      if (data.files && data.files.length > 0) {
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

            await supabase.from('mst_event_file').insert([fileData]);
          }
        }
      }

      // 質問の保存処理
      if (data.questions && data.questions.length > 0) {
        console.log('質問保存開始:', data.questions);
        try {
          const questionsData = data.questions.map((question, index) => ({
            event_id: eventId,
            title: question.title,
            question_type: question.question_type,
            options: ['select', 'multiple_select'].includes(
              question.question_type,
            )
              ? question.options
              : null,
            is_required: question.is_required || false,
            display_order: question.display_order ?? index,
          }));

          console.log('保存する質問データ:', questionsData);

          const { data: questionsResult, error: questionsError } =
            await supabase
              .from('trn_event_question')
              .insert(questionsData)
              .select('*');

          if (questionsError) {
            console.error('質問保存エラー:', questionsError);
            throw questionsError;
          }

          console.log('質問保存成功:', questionsResult);
        } catch (error) {
          console.error('質問保存処理でエラー:', error);
          // 質問保存に失敗してもイベント作成は継続する
        }
      } else {
        console.log('保存する質問がありません');
      }

      // グループの関連データを保存
      if (data.visible_group_ids && data.visible_group_ids.length > 0) {
        const groupData = data.visible_group_ids.map((groupId: string) => ({
          event_id: eventId,
          group_id: groupId,
        }));

        const { error: groupError } = await supabase
          .from('trn_event_visible_group')
          .insert(groupData);

        if (groupError) {
          console.error('グループ関連データの保存に失敗:', groupError);
          throw groupError;
        }
      }

      // 最終確認 - イベントデータを再取得
      const { data: finalEvent } = await supabase
        .from('mst_event')
        .select('*')
        .eq('event_id', eventId)
        .is('deleted_at', null)
        .single();

      console.log('最終イベントデータ確認:', finalEvent);

      // 成功時に一覧画面に遷移
      router.push('/eventlist');
    } catch (error) {
      console.error('イベント作成に失敗しました:', error);
    }
  };

  const handleCancel = () => {
    // 前のページに戻る
    router.back();
  };

  return (
    <div>
      {/* イベントフォーム */}
      <EventForm
        key={formKey}
        isEditing={false}
        initialData={templateData || {}}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onTemplateSelect={() => setShowTemplateSelector(true)}
        isLoadingTemplate={isLoadingTemplate}
      />

      {/* テンプレート選択モーダル */}
      {showTemplateSelector && (
        <EventTemplateSelector
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  );
}
