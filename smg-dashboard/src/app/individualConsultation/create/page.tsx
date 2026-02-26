'use client';

import { ConsultationTemplateSelector } from '@/components/individualConsultation/ConsultationTemplateSelector';
import { IndividualConsultationForm } from '@/components/individualConsultation/IndividualConsultationForm';
import { compressImage } from '@/lib/imageCompression';
import { createClient } from '@/lib/supabase/client';
import type {
  ConsultationQuestionFormType,
  IndividualConsultationFormType,
} from '@/types/individualConsultation';
import { utcToJst } from '@/utils/date';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function EventCreatePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templateData, setTemplateData] =
    useState<IndividualConsultationFormType | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // テンプレート選択処理
  const handleTemplateSelect = async (consultationId: string) => {
    setIsLoadingTemplate(true);
    try {
      // APIでテンプレートデータ取得
      const response = await fetch('/api/consultation-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consultation_id: consultationId }),
      });

      if (!response.ok) throw new Error('テンプレート取得に失敗しました');

      const { consultation, schedules, questions } = await response.json();

      // 日時フォーマット変換関数（datetime-local用）
      const formatForDatetimeLocal = (
        dateString: string | null,
      ): string | undefined => {
        if (!dateString) return undefined;
        const jstString = utcToJst(dateString);
        return jstString ? jstString.slice(0, 16) : undefined;
      };

      // 日程データの変換
      const scheduleStrings = schedules.map(
        (s: { schedule_datetime: string }) =>
          formatForDatetimeLocal(s.schedule_datetime),
      );

      // 質問データの変換
      const templateQuestions: ConsultationQuestionFormType[] = questions.map(
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

      // テンプレートデータを設定
      const newTemplateData: IndividualConsultationFormType = {
        title: `${consultation.title} (コピー)`,
        description: consultation.description,
        application_start_datetime: formatForDatetimeLocal(
          consultation.application_start_datetime,
        ),
        application_end_datetime: formatForDatetimeLocal(
          consultation.application_end_datetime,
        ),
        publish_start_at: formatForDatetimeLocal(consultation.publish_start_at),
        publish_end_at: formatForDatetimeLocal(consultation.publish_end_at),
        instructor_id: consultation.instructor_id,
        image_url: consultation.image_url,
        schedule_datetime: scheduleStrings,
        questions: templateQuestions,
      };

      setTemplateData(newTemplateData);
      setFormKey((prev) => prev + 1);
      setShowTemplateSelector(false);
    } catch (error) {
      console.error('テンプレート読込エラー:', error);
      alert('テンプレートの読み込みに失敗しました');
    } finally {
      setIsLoadingTemplate(false);
    }
  };

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
          console.log('サムネイルアップロード開始:', {
            imageType: typeof data.image_url,
            isFile: data.image_url instanceof File,
          });

          // 画像を圧縮
          const thumbnail = data.image_url as File;
          const compressResult = await compressImage(thumbnail, 85, 1200);
          const file = compressResult.file;

          console.log('画像圧縮完了:', {
            元のサイズ: thumbnail.size,
            圧縮後のサイズ: file.size,
          });

          // Supabaseのストレージにアップロード
          const fileExt = file.name.split('.').pop();
          const filePath = `online_consultation_image/${Date.now()}.${fileExt}`;

          console.log('Supabaseアップロード開始:', {
            filePath,
            fileSize: file.size,
          });

          const { error: uploadError, data: uploadData } =
            await supabase.storage
              .from('online_consultation')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
              });

          if (uploadError) {
            console.error('Supabaseアップロードエラー:', uploadError);
            throw new Error(
              `画像のアップロードに失敗しました: ${uploadError.message}`,
            );
          }

          console.log('Supabaseアップロード成功:', uploadData);

          // 画像URLを取得
          const { data: urlData } = supabase.storage
            .from('online_consultation')
            .getPublicUrl(filePath);

          console.log('取得した画像URL:', urlData);

          imageUrl = urlData.publicUrl;
        } catch (err) {
          console.error('画像処理エラー:', err);
          throw new Error('画像の処理中にエラーが発生しました');
        }
      } else if (typeof data.image_url === 'string' && data.image_url) {
        console.log('既存の画像URLを使用:', data.image_url);
        imageUrl = data.image_url;
      }

      // APIにデータを送信
      const response = await fetch('/api/individualConsultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        throw new Error(errorData.error || '個別相談会の作成に失敗しました');
      }

      // 成功時に一覧画面に遷移
      router.push('/individualConsultationlist');
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
    router.back();
  };

  return (
    <>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      <IndividualConsultationForm
        key={formKey}
        isEditing={false}
        initialData={templateData || {}}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onTemplateSelect={() => setShowTemplateSelector(true)}
        isLoadingTemplate={isLoadingTemplate}
      />
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg">
            <p className="text-lg">処理中...</p>
          </div>
        </div>
      )}

      {/* テンプレート選択モーダル */}
      {showTemplateSelector && (
        <ConsultationTemplateSelector
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </>
  );
}
