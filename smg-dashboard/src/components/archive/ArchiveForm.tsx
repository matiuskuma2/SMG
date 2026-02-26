'use client';

import type {
  ArchiveFile,
  ArchiveFormData,
  ArchiveFormProps,
  ArchiveVideo,
} from '@/components/archive/archive';
import {
  DateValidationErrors,
  FieldDateError,
} from '@/components/ui/DateValidationErrors';
import { FormActionButtons } from '@/components/ui/FormActionButtons';
import { UnlimitedToggle } from '@/components/ui/UnlimitedToggle';
import { useSimpleDateValidation } from '@/hooks/useDateTimeValidation';
import { DEFAULT_PUBLISH_END_DATE } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import { utcToJst } from '@/utils/date';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArchiveImageUploader } from './ArchiveImageUploader';
import { FileUploader } from './FileUploader';
import { VideoUploader } from './VideoUploader';

type Group = {
  group_id: string;
  title: string;
  description: string | null;
};

export function ArchiveForm({
  eventId,
  onSubmit,
  onCancel,
  onDelete,
  initialData,
  isEditing = false,
  archiveTypes = [],
  selectedArchiveType = '',
  onArchiveTypeChange,
  themes = [],
  isEventArchive = false,
  onImageUpload,
}: ArchiveFormProps) {
  const supabase = createClient();

  // フォームの状態管理
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(
    initialData?.description || '',
  );
  const [publishStartAt, setPublishStartAt] = useState(
    initialData?.publish_start_at || '',
  );
  const [publishEndAt, setPublishEndAt] = useState(
    initialData?.publish_end_at || '',
  );
  const [files, setFiles] = useState<ArchiveFile[]>(
    initialData?.files?.map((file, index) => ({
      ...file,
      display_order: file.display_order || index + 1,
    })) || [],
  );
  const [videos, setVideos] = useState<ArchiveVideo[]>(
    initialData?.videos?.map((video, index) => ({
      ...video,
      display_order: video.display_order || index + 1,
    })) || [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnlimited, setIsUnlimited] = useState(
    initialData?.publish_end_at
      ? utcToJst(initialData.publish_end_at).startsWith('2200')
      : false,
  );
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    initialData?.visible_group_ids || [],
  );
  const filesRef = useRef<ArchiveFile[]>(
    initialData?.files?.map((file, index) => ({
      ...file,
      display_order: file.display_order || index + 1,
    })) || [],
  );

  // 画像関連の状態管理
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialData?.image_url || null,
  );
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // 日付整合性チェック
  const initialStartAt = initialData?.publish_start_at
    ? utcToJst(initialData.publish_start_at)
    : '';
  const initialEndAt = initialData?.publish_end_at
    ? utcToJst(initialData.publish_end_at)
    : '';
  const { errors, hasErrors, updateAllFields, hasFieldError } =
    useSimpleDateValidation(
      {
        start: initialStartAt,
        end: isUnlimited ? DEFAULT_PUBLISH_END_DATE : initialEndAt,
      },
      '投稿開始',
      '投稿終了',
    );

  // 日付変更時のバリデーション更新
  const updateValidation = useCallback(() => {
    updateAllFields({
      start: publishStartAt,
      end: isUnlimited ? DEFAULT_PUBLISH_END_DATE : publishEndAt,
    });
  }, [publishStartAt, publishEndAt, isUnlimited, updateAllFields]);

  // 日付が変更されたらバリデーション実行
  useEffect(() => {
    updateValidation();
  }, [updateValidation]);

  // 無期限トグルの変更時の処理
  const handleUnlimitedChange = (checked: boolean) => {
    setIsUnlimited(checked);
    if (checked) {
      setPublishEndAt(DEFAULT_PUBLISH_END_DATE);
    } else {
      setPublishEndAt(
        initialData?.publish_end_at ? utcToJst(initialData.publish_end_at) : '',
      );
    }
  };

  // グループデータを取得
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data, error } = await supabase
          .from('mst_group')
          .select('group_id, title, description')
          .is('deleted_at', null)
          .order('created_at', { ascending: true });

        if (error) {
          throw error;
        }

        if (data) {
          setGroups(data);
        }
      } catch (error) {
        console.error('グループの取得に失敗しました:', error);
      }
    };

    fetchGroups();
  }, [supabase]);

  // initialDataが変更された時に状態を更新
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      // UTC時刻を日本時間のdatetime-local形式に変換
      setPublishStartAt(
        initialData.publish_start_at
          ? utcToJst(initialData.publish_start_at)
          : '',
      );
      setPublishEndAt(
        initialData.publish_end_at ? utcToJst(initialData.publish_end_at) : '',
      );
      setFiles(
        initialData.files?.map((file, index) => ({
          ...file,
          display_order: file.display_order || index + 1,
        })) || [],
      );
      setVideos(
        initialData.videos?.map((video, index) => ({
          ...video,
          display_order: video.display_order || index + 1,
        })) || [],
      );
      setSelectedGroupIds(initialData.visible_group_ids || []);
      setImageUrl(initialData.image_url || null);
    }
  }, [initialData]);

  // ファイルの状態変更ハンドラ
  const handleFilesChange = useCallback((newFiles: ArchiveFile[]) => {
    // 前回の値と同じ場合は更新しない
    if (JSON.stringify(filesRef.current) === JSON.stringify(newFiles)) {
      return;
    }

    // display_orderを確実に設定
    const filesWithOrder = newFiles.map((file, index) => ({
      ...file,
      display_order: file.display_order || index + 1,
    }));

    filesRef.current = filesWithOrder;
    setFiles(filesWithOrder);
  }, []);

  // 動画の状態変更ハンドラ
  const handleVideosChange = (
    newVideosOrUpdater:
      | ArchiveVideo[]
      | ((prevVideos: ArchiveVideo[]) => ArchiveVideo[]),
  ) => {
    setVideos((prevVideos) => {
      const newVideos =
        typeof newVideosOrUpdater === 'function'
          ? newVideosOrUpdater(prevVideos)
          : newVideosOrUpdater;
      console.log('handleVideosChange:', {
        prevVideos,
        newVideos,
      });
      // display_orderを確実に設定
      const videosWithOrder = newVideos.map((video, index) => ({
        ...video,
        display_order: video.display_order || index + 1,
      }));
      return videosWithOrder;
    });
  };

  // 画像変更ハンドラ
  const handleImageChange = useCallback(
    (file: File | null, previewUrl: string | null) => {
      setPendingImageFile(file);
      setImageUrl(previewUrl);
    },
    [],
  );

  // 画像エラーハンドラ
  const handleImageError = useCallback((error: string | null) => {
    setImageError(error);
  }, []);

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();

    // 日付整合性エラーがある場合は送信をブロック
    if (hasErrors) {
      console.error('日付整合性エラーがあります:', errors);
      return;
    }

    // 送信中フラグを設定
    setIsSubmitting(true);

    try {
      // 画像のアップロード処理
      let uploadedImageUrl = imageUrl;
      if (pendingImageFile && onImageUpload) {
        try {
          uploadedImageUrl = await onImageUpload(pendingImageFile);
          setPendingImageFile(null);
        } catch (error) {
          console.error('画像アップロードエラー:', error);
          alert('画像のアップロードに失敗しました。');
          setIsSubmitting(false);
          return;
        }
      }

      // 現在の最新状態を取得
      const formData: ArchiveFormData = {
        title,
        description,
        publish_start_at: publishStartAt,
        publish_end_at: publishEndAt,
        files,
        videos,
        event_id: '',
        event_type_id: '',
        type_id: initialData?.type_id || null,
        created_at: null,
        updated_at: null,
        deleted_at: null,
        is_draft: isDraft,
        visible_group_ids: selectedGroupIds,
        image_url: uploadedImageUrl,
        notification_sent: initialData?.notification_sent ?? false,
      };

      console.log('フォーム送信開始:', {
        ...formData,
        filesCount: files.length,
        videosCount: videos.length,
        isDraft,
        filesDetails: files.map((file, index) => ({
          index,
          file_url: file.file_url,
          has_file: !!file.file_url,
        })),
        videosDetails: videos.map((video, index) => ({
          index,
          video_url: video.video_url,
          has_video: !!video.video_url,
        })),
      });

      // フォームデータを直接渡して送信
      await onSubmit(formData);
      console.log('フォーム送信成功');
    } catch (error) {
      console.error('アーカイブ作成エラー:', {
        message: error instanceof Error ? error.message : '不明なエラー',
        error,
      });
      alert(
        'アーカイブの作成に失敗しました。\n詳細はコンソールを確認してください。',
      );
    } finally {
      setIsSubmitting(false);
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
    <form
      onSubmit={handleSubmit}
      className={css({ display: 'flex', flexDirection: 'column', gap: '4' })}
    >
      {/* 基本情報セクション */}
      <div
        className={css({
          bg: 'white',
          p: '6',
          rounded: 'md',
        })}
      >
        <h2
          className={css({
            fontSize: 'xl',
            fontWeight: 'bold',
            mb: '4',
            borderBottom: '1px solid',
            borderColor: 'gray.200',
            pb: '2',
          })}
        >
          基本情報
        </h2>

        <div className={css({ mb: '4' })}>
          <label
            htmlFor="title"
            className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
          >
            タイトル <span className={css({ color: 'red.500' })}>*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={css({
              w: 'full',
              p: '2',
              border: '1px solid',
              borderColor: 'gray.300',
              rounded: 'md',
            })}
            required
          />
        </div>

        {/* サムネイル */}
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
        <ArchiveImageUploader
          imageUrl={imageUrl}
          onChange={handleImageChange}
          onError={handleImageError}
        />

        <div className={css({ mb: '4' })}>
          <label
            htmlFor="description"
            className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
          >
            説明
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={css({
              w: 'full',
              p: '2',
              border: '1px solid',
              borderColor: 'gray.300',
              rounded: 'md',
              minH: '32',
            })}
          />
        </div>

        {/* 日付整合性エラー表示 */}
        {hasErrors && <DateValidationErrors errors={errors} />}

        <div
          className={css({
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4',
          })}
        >
          <div>
            <label
              htmlFor="publishStartAt"
              className={css({
                display: 'block',
                mb: '2',
                fontWeight: 'medium',
              })}
            >
              投稿開始日時 <span className={css({ color: 'red.500' })}>*</span>
            </label>
            <input
              id="publishStartAt"
              type="datetime-local"
              autoComplete="one-time-code"
              value={publishStartAt}
              onChange={(e) => setPublishStartAt(e.target.value)}
              className={css({
                w: 'full',
                p: '2',
                border: '1px solid',
                borderColor: hasFieldError('start') ? 'red.500' : 'gray.300',
                rounded: 'md',
              })}
              required
            />
            <FieldDateError errors={errors} field="start" />
          </div>

          <div>
            <div
              className={css({
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: '2',
              })}
            >
              <label
                htmlFor="publishEndAt"
                className={css({ fontWeight: 'medium' })}
              >
                投稿終了日時{' '}
                <span className={css({ color: 'red.500' })}>*</span>
              </label>
              <UnlimitedToggle
                checked={isUnlimited}
                onChange={handleUnlimitedChange}
              />
            </div>
            <input
              id="publishEndAt"
              type="datetime-local"
              autoComplete="one-time-code"
              value={isUnlimited ? '' : publishEndAt}
              onChange={(e) => setPublishEndAt(e.target.value)}
              className={css({
                w: 'full',
                p: '2',
                border: '1px solid',
                borderColor: hasFieldError('end') ? 'red.500' : 'gray.300',
                rounded: 'md',
                opacity: isUnlimited ? 0.5 : 1,
              })}
              required={!isUnlimited}
              disabled={isUnlimited}
            />
            {isUnlimited && (
              <input
                type="hidden"
                name="publishEndAt"
                value={DEFAULT_PUBLISH_END_DATE}
              />
            )}
            <FieldDateError errors={errors} field="end" />
          </div>
        </div>
      </div>

      {/* アーカイブタイプ選択 */}
      {archiveTypes.length > 0 && (
        <div
          className={css({
            bg: 'white',
            p: '6',
            rounded: 'md',
          })}
        >
          <div
            className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
          >
            アーカイブタイプ{' '}
            <span className={css({ color: 'red.500' })}>*</span>
          </div>
          <div className={css({ display: 'flex', flexWrap: 'wrap', gap: '4' })}>
            {archiveTypes.map((type) => (
              <label
                key={type.id}
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2',
                })}
              >
                <input
                  type="radio"
                  name="archive-type"
                  value={type.id}
                  checked={selectedArchiveType === type.id}
                  onChange={(e) => onArchiveTypeChange?.(e.target.value)}
                  required
                />
                {type.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 表示グループ選択 */}
      <div
        className={css({
          bg: 'white',
          p: '6',
          rounded: 'md',
        })}
      >
        <label
          htmlFor="visible_group_ids"
          className={css({
            display: 'block',
            mb: '2',
            fontWeight: 'medium',
          })}
        >
          表示グループ
        </label>
        <div
          className={css({
            border: '1px solid',
            borderColor: 'gray.300',
            borderRadius: 'md',
            maxHeight: '120px',
            overflowY: 'auto',
            p: '2',
            bg: 'white',
          })}
        >
          {groups.length === 0 ? (
            <div className={css({ color: 'gray.500', fontSize: 'sm' })}>
              グループを読み込み中...
            </div>
          ) : (
            groups.map((group) => (
              <label
                key={group.group_id}
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2',
                  mb: '2',
                  cursor: 'pointer',
                  _last: { mb: '0' },
                })}
              >
                <input
                  type="checkbox"
                  name="visible_group_ids"
                  value={group.group_id}
                  checked={selectedGroupIds.includes(group.group_id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedGroupIds([
                        ...selectedGroupIds,
                        group.group_id,
                      ]);
                    } else {
                      setSelectedGroupIds(
                        selectedGroupIds.filter((id) => id !== group.group_id),
                      );
                    }
                  }}
                  disabled={isSubmitting}
                  className={css({
                    cursor: 'pointer',
                  })}
                />
                <span className={css({ fontSize: 'sm' })}>{group.title}</span>
              </label>
            ))
          )}
        </div>
        <div className={css({ color: 'red.600', mt: '2' })}>
          <div className={css({ fontSize: 'sm' })}>
            {isEventArchive
              ? 'この設定はイベント全体の表示グループに反映されます。'
              : '表示するグループを選択したい場合は、こちらからお選びください。'}
          </div>
          <div className={css({ fontSize: 'sm' })}>
            ※何も選ばない場合は全員に表示されます。
          </div>
        </div>
      </div>

      {/* ファイルアップロードセクション */}
      <FileUploader
        initialFiles={files}
        onChange={handleFilesChange}
        themes={themes}
      />

      {/* 動画アップロードセクション */}
      <VideoUploader
        supabase={supabase}
        videos={videos}
        onVideosChange={handleVideosChange}
        isSubmitting={isSubmitting}
        themes={themes}
      />

      {/* フォームボタン */}
      <FormActionButtons
        isEditing={isEditing}
        onCancel={onCancel}
        onDelete={onDelete}
        onSaveDraft={handleSaveDraft}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
