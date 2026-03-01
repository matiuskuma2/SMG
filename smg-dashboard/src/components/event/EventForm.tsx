import { compressImage, formatFileSize } from '@/lib/imageCompression';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import type { DateValidationError } from '@/utils/dateValidation';
import { Copy } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useCallback, useRef } from 'react';
import { EventBasicInfo } from './EventBasicInfo';
import { EventConsultationInfo } from './EventConsultationInfo';
import { EventFileUploader } from './EventFileUploader';
import { EventFormButtons } from './EventFormButtons';
import { EventPartyInfo } from './EventPartyInfo';
import { EventQuestionManager } from './EventQuestionManager';
import type { EventFile, EventFormData, EventQuestionFormType } from './types';

// 画像サイズの制限を設定（10MB）
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

type EventFormProps = {
  isEditing: boolean;
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData, isDraft?: boolean) => Promise<void>;
  onCancel: () => void;
  onTemplateSelect?: () => void;
  isLoadingTemplate?: boolean;
};

export const EventForm = ({
  isEditing,
  initialData = {},
  onSubmit,
  onCancel,
  onTemplateSelect,
  isLoadingTemplate = false,
}: EventFormProps) => {
  const [thumbnail, setThumbnail] = useState<File | null | string>(
    initialData.image_url || null,
  );
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    typeof initialData.image_url === 'string' ? initialData.image_url : null,
  );
  const [hasPartyInfo, setHasPartyInfo] = useState<boolean>(
    !!(
      initialData.gather_start_time ||
      initialData.gather_location ||
      initialData.gather_capacity
    ),
  );
  const [imageError, setImageError] = useState<string | null>(null);
  const [eventFiles, setEventFiles] = useState<EventFile[]>(
    initialData.files || [],
  );
  const [eventQuestions, setEventQuestions] = useState<EventQuestionFormType[]>(
    initialData.questions || [],
  );
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    initialData.visible_group_ids || [],
  );
  const [dateValidationErrors, setDateValidationErrors] = useState<
    DateValidationError[]
  >([]);
  const supabase = createClient();
  const eventFilesRef = useRef<EventFile[]>(initialData.files || []);

  // ファイルリストの更新を完全にメモ化
  const handleFilesChange = useCallback((files: EventFile[]) => {
    // 前回の値と同じ場合は更新しない
    if (JSON.stringify(eventFilesRef.current) === JSON.stringify(files)) {
      return;
    }

    eventFilesRef.current = files;
    setEventFiles(files);
  }, []);

  // 質問リストの更新処理
  const handleQuestionsChange = useCallback(
    (questions: EventQuestionFormType[]) => {
      setEventQuestions(questions);
    },
    [],
  );
  const handleGroupsChange = (groupIds: string[]) => {
    setSelectedGroupIds(groupIds);
  };

  // 日付バリデーションエラーのハンドリング
  const handleDateValidationChange = useCallback(
    (errors: DateValidationError[]) => {
      setDateValidationErrors(errors);
    },
    [],
  );

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

        // 圧縮結果をログに出力
        console.log('画像圧縮結果:', {
          元のサイズ: formatFileSize(originalSize),
          圧縮後のサイズ: formatFileSize(compressedSize),
          圧縮率: `${compressionRatio}%`,
        });

        // 圧縮された画像を設定
        setThumbnail(compressedFile);
        setImageError(null);

        // プレビュー表示
        const reader = new FileReader();
        reader.onload = (e) => {
          setThumbnailPreview(e.target?.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('画像圧縮エラー:', error);
        setImageError('画像の処理中にエラーが発生しました。');
      }
    } else {
      setThumbnail(null);
      setThumbnailPreview(null);
    }
  };

  // 画像をStorageにアップロードする関数
  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `event_image/${fileName}`;

      console.log('画像アップロード準備:', {
        バケット: 'event',
        パス: filePath,
        ファイル: file.name,
      });

      const { error: uploadError } = await supabase.storage
        .from('event')
        .upload(filePath, file);

      if (uploadError) {
        console.error('EventForm.uploadImage - エラー:', uploadError);
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('event').getPublicUrl(filePath);

      console.log('取得した画像URL:', publicUrl);

      return publicUrl;
    } catch (error) {
      console.error('画像アップロードエラー:', error);
      throw new Error('画像のアップロードに失敗しました');
    }
  };

  // 古い画像を削除する関数
  const deleteOldImage = async (imageUrl: string) => {
    try {
      const path = imageUrl.split('/').pop();
      if (path) {
        const { error } = await supabase.storage
          .from('event')
          .remove([`event_image/${path}`]);

        if (error) {
          console.error('古い画像の削除エラー:', error);
        }
      }
    } catch (error) {
      console.error('画像削除エラー:', error);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    isDraft = false,
  ) => {
    e.preventDefault();

    if (imageError) {
      return;
    }

    // 日付整合性エラーがある場合は送信をブロック
    if (dateValidationErrors.length > 0) {
      console.error('日付整合性エラーがあります:', dateValidationErrors);
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    const getRequiredString = (key: string): string => {
      const value = formData.get(key);
      if (typeof value !== 'string') {
        throw new Error(`Missing required field: ${key}`);
      }
      return value;
    };

    const getOptionalString = (key: string): string | undefined => {
      const value = formData.get(key);
      return typeof value === 'string' ? value : undefined;
    };

    const getRequiredNumber = (key: string): number => {
      const value = formData.get(key);
      if (typeof value !== 'string') {
        throw new Error(`Missing required field: ${key}`);
      }
      const num = Number(value);
      if (Number.isNaN(num)) {
        throw new Error(`Invalid number for field: ${key}`);
      }
      return num;
    };

    const getOptionalNumber = (key: string): number | undefined => {
      const value = formData.get(key);
      if (typeof value !== 'string') {
        return undefined;
      }
      const num = Number(value);
      return Number.isNaN(num) ? undefined : num;
    };

    // event_typeの取得方法を修正
    const getEventType = (): string | null => {
      const value = formData.get('event_type');
      if (!value || typeof value !== 'string') return null;
      // UUIDのみを抽出
      const match = value.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
      );
      return match ? match[0] : null;
    };

    const eventType = getEventType();
    if (!eventType) {
      throw new Error('開催区分は必須です');
    }

    let imageUrl = typeof thumbnail === 'string' ? thumbnail : null;

    // 新しい画像がアップロードされた場合
    if (thumbnail instanceof File) {
      console.log('画像をアップロードします:', thumbnail.name);
      imageUrl = await uploadImage(thumbnail);
      console.log('アップロードした画像のURL:', imageUrl);

      // 編集時に古い画像があれば削除
      if (
        isEditing &&
        initialData.image_url &&
        typeof initialData.image_url === 'string'
      ) {
        await deleteOldImage(initialData.image_url);
      }
    } else {
      console.log('Fileオブジェクトではない thumbnail:', thumbnail);
    }

    const data: EventFormData = {
      event_id: initialData.event_id,
      event_name: getRequiredString('title'),
      event_start_datetime: getRequiredString('startDateTime'),
      event_end_datetime: getRequiredString('endDateTime'),
      event_location: getRequiredString('location'),
      event_city: getRequiredString('region'),
      event_capacity: getRequiredNumber('capacity'),
      event_type: eventType,
      event_description: getRequiredString('description'),
      registration_start_datetime: getRequiredString(
        'registrationStartDateTime',
      ),
      registration_end_datetime: getRequiredString('registrationEndDateTime'),
      has_gather: hasPartyInfo,
      gather_start_time: null,
      gather_end_time: null,
      gather_location: null,
      gather_price: null,
      gather_capacity: null,
      gather_registration_end_datetime: null,
      has_consultation: false,
      consultation_capacity: null,
      publish_start_at: null,
      publish_end_at: null,
      files: eventFiles,
      questions: eventQuestions,
      visible_group_ids: selectedGroupIds,
    };

    if (imageUrl) {
      console.log('EventForm: 画像URLをdataに設定:', imageUrl);
      data.image_url = imageUrl;
    } else {
      console.log('EventForm: 画像URLがnullまたは空のため設定なし');
    }

    const publishStartDateTime = getOptionalString('publishStartDateTime');
    if (publishStartDateTime) {
      data.publish_start_at = publishStartDateTime;
    }

    const publishEndDateTime = getOptionalString('publishEndDateTime');
    if (publishEndDateTime) {
      data.publish_end_at = publishEndDateTime;
    }

    const partyStartDateTime = getOptionalString('partyStartDateTime');
    if (partyStartDateTime) {
      data.gather_start_time = partyStartDateTime;
    }

    const partyEndDateTime = getOptionalString('partyEndDateTime');
    if (partyEndDateTime) {
      data.gather_end_time = partyEndDateTime;
    }

    const partyLocation = getOptionalString('partyLocation');
    if (partyLocation) {
      data.gather_location = partyLocation;
    }

    const partyFee = getOptionalNumber('partyFee');
    if (partyFee !== undefined) {
      data.gather_price = partyFee;
    }

    const partyCapacity = getOptionalNumber('partyCapacity');
    if (partyCapacity !== undefined) {
      data.gather_capacity = partyCapacity;
    }

    const partyRegistrationEndDateTime = getOptionalString('partyRegistrationEndDateTime');
    if (partyRegistrationEndDateTime) {
      data.gather_registration_end_datetime = partyRegistrationEndDateTime;
    }

    const consultationCapacity = getOptionalNumber('consultationCapacity');
    if (consultationCapacity !== undefined) {
      data.consultation_capacity = consultationCapacity;
    }

    try {
      await onSubmit(data, isDraft);
      console.log('フォーム送信成功');
    } catch (error) {
      console.error('フォーム送信中にエラーが発生しました:', error);
      throw error;
    }
  };

  const handleSaveDraft = async () => {
    const form = document.querySelector('form');
    if (form instanceof HTMLFormElement) {
      const syntheticEvent = {
        preventDefault: () => {},
        currentTarget: form,
      } as React.FormEvent<HTMLFormElement>;
      await handleSubmit(syntheticEvent, true);
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
            {isEditing ? 'イベントの編集' : 'イベントの作成'}
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
              {isLoadingTemplate ? '読み込み中...' : '過去のイベント'}
            </button>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className={css({ display: 'flex', flexDir: 'column', gap: '6' })}
        >
          {imageError && (
            <div
              className={css({
                color: 'red.500',
                fontSize: 'sm',
                mb: '2',
              })}
            >
              {imageError}
            </div>
          )}
          <EventBasicInfo
            key={`basic-${initialData.event_name}`}
            initialData={{
              ...initialData,
              image_url: thumbnailPreview,
              event_type: initialData.event_type || '',
            }}
            onThumbnailChange={handleThumbnailChange}
            initialSelectedGroupIds={selectedGroupIds}
            onGroupsChange={handleGroupsChange}
            onValidationChange={handleDateValidationChange}
          />

          <EventPartyInfo
            key={`party-${initialData.gather_start_time}-${initialData.gather_end_time}`}
            initialData={{
              partyStartDateTime: initialData.gather_start_time || undefined,
              partyEndDateTime: initialData.gather_end_time || undefined,
              partyLocation: initialData.gather_location || undefined,
              partyFee: initialData.gather_price || undefined,
              partyCapacity: initialData.gather_capacity || undefined,
              partyRegistrationEndDateTime: initialData.gather_registration_end_datetime || undefined,
            }}
            onPartyInfoChange={(hasInfo) => setHasPartyInfo(hasInfo)}
          />
          {hasPartyInfo && (
            <EventConsultationInfo
              initialData={{
                consultationCapacity:
                  initialData.consultation_capacity || undefined,
              }}
            />
          )}

          {/* イベントファイルアップローダー */}
          <div
            className={css({
              borderTop: '1px solid',
              borderColor: 'gray.200',
              pt: '4',
              mb: '10',
            })}
          >
            <EventFileUploader
              initialFiles={eventFiles}
              onChange={handleFilesChange}
            />
          </div>
          {/* イベント質問設定 */}
          <div
            className={css({
              borderTop: '1px solid',
              borderColor: 'gray.200',
              pt: '4',
            })}
          >
            <EventQuestionManager
              eventId={initialData.event_id || null}
              isEditing={isEditing}
              initialQuestions={eventQuestions}
              onQuestionsChange={handleQuestionsChange}
            />
          </div>

          <EventFormButtons
            isEditing={isEditing}
            onCancel={onCancel}
            onSaveDraft={handleSaveDraft}
          />
        </form>
      </div>
    </div>
  );
};
