import { compressImage } from '@/lib/imageCompression';
import { css } from '@/styled-system/css';
import type {
  ConsultationQuestionFormType,
  IndividualConsultationFormType,
} from '@/types/individualConsultation';
import { jstToUtc } from '@/utils/date';
import { Copy } from 'lucide-react';
import { useState } from 'react';
import { FormActionButtons } from '../ui/FormActionButtons';
import { ConsultationQuestionManager } from './ConsultationQuestionManager';
import { IndividualConsultationBasicInfo } from './IndividualConsultationBasicInfo';

// 画像アップロードの設定
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// ファイルサイズを読みやすい形式に変換
const formatFileSize = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round((bytes / 1024 ** i) * 100) / 100} ${sizes[i]}`;
};

type IndividualConsultationFormProps = {
  isEditing: boolean;
  initialData?: Partial<IndividualConsultationFormType>;
  onSubmit: (data: IndividualConsultationFormType, isDraft?: boolean) => void;
  onCancel: () => void;
  onTemplateSelect?: () => void;
  isLoadingTemplate?: boolean;
};

export const IndividualConsultationForm = ({
  isEditing,
  initialData = {},
  onSubmit,
  onCancel,
  onTemplateSelect,
  isLoadingTemplate = false,
}: IndividualConsultationFormProps) => {
  // 初期値の型を適切に処理
  const initialThumbnail = initialData.image_url || null;
  const [thumbnail, setThumbnail] = useState<File | string | null>(
    initialThumbnail,
  );
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    typeof initialThumbnail === 'string' ? initialThumbnail : null,
  );
  const [imageError, setImageError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ConsultationQuestionFormType[]>(
    initialData.questions || [],
  );

  const handleQuestionsChange = (
    newQuestions: ConsultationQuestionFormType[],
  ) => {
    setQuestions(newQuestions);
  };

  const handleThumbnailChange = async (file: File | null) => {
    if (file) {
      // ファイルサイズのチェック
      if (file.size > MAX_IMAGE_SIZE) {
        setImageError(
          `画像サイズが大きすぎます。${formatFileSize(MAX_IMAGE_SIZE)}以下の画像を選択してください。`,
        );
        return;
      }

      try {
        // 画像を圧縮
        const {
          file: compressedFile,
          originalSize,
          compressedSize,
          compressionRatio,
        } = await compressImage(file, 80, 1200);

        // 圧縮された画像を設定
        setThumbnail(compressedFile);
        setImageError(null);

        // プレビュー表示
        const reader = new FileReader();
        reader.onload = (e) => {
          const previewUrl = e.target?.result as string;
          setThumbnailPreview(previewUrl);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('画像圧縮エラー:', error);
        setImageError('画像の処理中にエラーが発生しました。');
      }
    } else {
      setThumbnail(null);
      setThumbnailPreview(null);
      setImageError(null);
    }
  };

  // 日本時間の日時文字列をUTC形式に変換する関数
  const convertJSTtoUTC = (
    dateTimeString: string | undefined,
  ): string | undefined => {
    if (!dateTimeString) return undefined;

    try {
      const jstDateString = `${dateTimeString}:00+09:00`;
      const jstDate = new Date(jstDateString);
      return jstDate.toISOString();
    } catch (error) {
      console.error('日時変換エラー:', error);
      return undefined;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('handleSubmit called');

    if (imageError) {
      console.log('Image error detected, returning');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const candidateDateTimes = formData
      .getAll('candidateDateTimes')
      .filter(Boolean)
      .map((value) => jstToUtc(value.toString()));

    const data: IndividualConsultationFormType & {
      questions?: ConsultationQuestionFormType[];
    } = {
      ...Object.fromEntries(formData),
      image_url: thumbnail,
      schedule_datetime: candidateDateTimes,
      instructor_id: formData.get('instructorName')?.toString(),
      application_start_datetime: jstToUtc(
        formData.get('application_start_datetime')?.toString() || '',
      ),
      application_end_datetime: jstToUtc(
        formData.get('application_end_datetime')?.toString() || '',
      ),
      publish_start_at: formData.get('publish_start_at')
        ? jstToUtc(formData.get('publish_start_at')?.toString() || '')
        : undefined,
      publish_end_at: formData.get('publish_end_at')
        ? jstToUtc(formData.get('publish_end_at')?.toString() || '')
        : undefined,
      questions: questions, // 質問データを追加
    };

    console.log('Calling onSubmit with data:', data);
    try {
      await onSubmit(data, false);
      console.log('onSubmit completed successfully');
    } catch (error) {
      console.error('フォーム送信エラー:', error);
    }
  };

  const handleSaveDraft = async () => {
    const form = document.querySelector('form');
    if (form instanceof HTMLFormElement) {
      const formData = new FormData(form);
      const candidateDateTimes = formData
        .getAll('candidateDateTimes')
        .filter(Boolean)
        .map((value) => jstToUtc(value.toString()));

      const data: IndividualConsultationFormType & {
        questions?: ConsultationQuestionFormType[];
      } = {
        ...Object.fromEntries(formData),
        image_url: thumbnail,
        schedule_datetime: candidateDateTimes,
        instructor_id: formData.get('instructorName')?.toString(),
        application_start_datetime: jstToUtc(
          formData.get('application_start_datetime')?.toString() || '',
        ),
        application_end_datetime: jstToUtc(
          formData.get('application_end_datetime')?.toString() || '',
        ),
        publish_start_at: formData.get('publish_start_at')
          ? jstToUtc(formData.get('publish_start_at')?.toString() || '')
          : undefined,
        publish_end_at: formData.get('publish_end_at')
          ? jstToUtc(formData.get('publish_end_at')?.toString() || '')
          : undefined,
        questions: questions,
      };

      try {
        await onSubmit(data, true);
      } catch (error) {
        console.error('下書き保存エラー:', error);
      }
    }
  };

  return (
    <div
      className={css({
        mx: 'auto',
        maxW: '900px',
        p: '3',
      })}
    >
      <div
        className={css({
          p: '6',
          bg: 'white',
          borderRadius: 'md',
          boxShadow: 'sm',
          mt: '8',
          mb: '8',
        })}
      >
        <div
          className={css({
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: '6',
            borderBottom: '1px solid',
            borderColor: 'gray.200',
            pb: '4',
          })}
        >
          <h1
            className={css({
              fontSize: '2xl',
              fontWeight: 'bold',
            })}
          >
            {isEditing ? '個別相談の編集' : '個別相談の作成'}
          </h1>
          {!isEditing && onTemplateSelect && (
            <button
              type="button"
              onClick={onTemplateSelect}
              disabled={isLoadingTemplate}
              className={css({
                position: 'absolute',
                right: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: '#3182ce',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isLoadingTemplate ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                _hover: {
                  backgroundColor: '#2c5aa0',
                },
                _disabled: {
                  backgroundColor: '#a0aec0',
                  cursor: 'not-allowed',
                },
              })}
            >
              <Copy size={18} />
              {isLoadingTemplate ? '読み込み中...' : '過去の個別相談'}
            </button>
          )}
        </div>

        <form
          id="consultation-form"
          onSubmit={handleSubmit}
          className={css({ display: 'flex', flexDir: 'column', gap: '6' })}
        >
          <IndividualConsultationBasicInfo
            initialData={{
              ...initialData,
              image_url: thumbnailPreview,
            }}
            onThumbnailChange={handleThumbnailChange}
            imageError={imageError}
          />

          {/* 質問管理セクション */}
          <ConsultationQuestionManager
            consultationId={initialData.consultation_id || null}
            isEditing={isEditing}
            onQuestionsChange={handleQuestionsChange}
            initialQuestions={initialData.questions || []}
          />

          <FormActionButtons
            isEditing={isEditing}
            onCancel={onCancel}
            onSaveDraft={handleSaveDraft}
          />
        </form>
      </div>
    </div>
  );
};
