'use client';

import {
  DateValidationErrors,
  FieldDateError,
} from '@/components/ui/DateValidationErrors';
import { FormActionButtons } from '@/components/ui/FormActionButtons';
import { Input } from '@/components/ui/input';
import { useSimpleDateValidation } from '@/hooks/useDateTimeValidation';
import { DEFAULT_PUBLISH_END_DATE } from '@/lib/constants';
import { compressImage, formatFileSize } from '@/lib/imageCompression';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import type { RadioFormData } from '@/types/radio';
import Image from 'next/image';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { RichTextEditor } from '../ui/RichTextEditor';
import { UnlimitedToggle } from '../ui/UnlimitedToggle';

// 画像サイズの制限を設定（10MB）
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
// 音声ファイルサイズの制限を設定（100MB）
const MAX_AUDIO_SIZE = 100 * 1024 * 1024;

type RadioFormProps = {
  isEditing: boolean;
  initialData?: Partial<RadioFormData>;
  onSubmit: (data: RadioFormData) => Promise<void>;
  onCancel: () => void;
};

export const RadioForm = ({
  isEditing,
  initialData = {},
  onSubmit,
  onCancel,
}: RadioFormProps) => {
  const [thumbnail, setThumbnail] = useState<File | null | string>(
    initialData.image_url || null,
  );
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    typeof initialData.image_url === 'string' ? initialData.image_url : null,
  );
  const [imageError, setImageError] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null | string>(
    initialData.radio_url || null,
  );
  const [audioError, setAudioError] = useState<string | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    initialData.selectedGroupIds || [],
  );
  const [groups, setGroups] = useState<{ group_id: string; title: string }[]>(
    [],
  );
  const [description, setDescription] = useState<string>(
    initialData.radio_description || '',
  );
  const [publishStartAt, setPublishStartAt] = useState(
    initialData.publish_start_at?.slice(0, 16) || '',
  );
  const [publishEndAt, setPublishEndAt] = useState(
    initialData.publish_end_at || '',
  );
  const [isUnlimited, setIsUnlimited] = useState(
    initialData.publish_end_at?.startsWith('2200') || false,
  );
  const supabase = createClient();

  // 日付整合性チェック
  const { errors, hasErrors, updateAllFields, hasFieldError } =
    useSimpleDateValidation(
      {
        start: initialData.publish_start_at,
        end: isUnlimited
          ? DEFAULT_PUBLISH_END_DATE
          : initialData.publish_end_at,
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
      setPublishEndAt(initialData.publish_end_at || '');
    }
  };

  // グループデータの取得
  useEffect(() => {
    const fetchGroups = async () => {
      const { data, error } = await supabase
        .from('mst_group')
        .select('group_id, title')
        .is('deleted_at', null)
        .order('title');

      if (error) {
        console.error('グループ取得エラー:', error);
      } else {
        setGroups(data || []);
      }
    };

    fetchGroups();
  }, [supabase]);

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

  const handleAudioFileChange = (file: File | null) => {
    if (file) {
      // ファイルサイズのチェック
      if (file.size > MAX_AUDIO_SIZE) {
        setAudioError(
          `音声ファイルサイズが大きすぎます。${formatFileSize(MAX_AUDIO_SIZE)}以下のファイルを選択してください。`,
        );
        return;
      }

      // 音声ファイルの形式チェック（mp3, wav, m4a, ogg）
      const allowedTypes = [
        'audio/mpeg',
        'audio/wav',
        'audio/x-m4a',
        'audio/ogg',
      ];
      if (!allowedTypes.includes(file.type)) {
        setAudioError('対応している音声形式はMP3、WAV、M4A、OGGです。');
        return;
      }

      setAudioFile(file);
      setAudioError(null);
      console.log('音声ファイル選択:', {
        ファイル名: file.name,
        サイズ: formatFileSize(file.size),
        形式: file.type,
      });
    } else {
      setAudioFile(null);
    }
  };

  // 画像をStorageにアップロードする関数
  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('radio_image')
        .upload(filePath, file);

      if (uploadError) {
        console.error('RadioForm.uploadImage - エラー:', uploadError);
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('radio_image').getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('画像アップロードエラー:', error);
      throw new Error('画像のアップロードに失敗しました');
    }
  };

  // 音声ファイルをStorageにアップロードする関数
  const uploadAudioFile = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('radio_audio')
        .upload(filePath, file);

      if (uploadError) {
        console.error('RadioForm.uploadAudioFile - エラー:', uploadError);
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('radio_audio').getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('音声ファイルアップロードエラー:', error);
      throw new Error('音声ファイルのアップロードに失敗しました');
    }
  };

  // 古い画像を削除する関数
  const deleteOldImage = async (imageUrl: string) => {
    try {
      const path = imageUrl.split('/').pop();
      if (path) {
        const { error } = await supabase.storage
          .from('radio_image')
          .remove([path]);

        if (error) {
          console.error('古い画像の削除エラー:', error);
        }
      }
    } catch (error) {
      console.error('画像削除エラー:', error);
    }
  };

  // 古い音声ファイルを削除する関数
  const deleteOldAudioFile = async (audioUrl: string) => {
    try {
      const path = audioUrl.split('/').pop();
      if (path) {
        const { error } = await supabase.storage
          .from('radio_audio')
          .remove([path]);

        if (error) {
          console.error('古い音声ファイルの削除エラー:', error);
        }
      }
    } catch (error) {
      console.error('音声ファイル削除エラー:', error);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    isDraft = false,
  ) => {
    e.preventDefault();

    if (imageError || audioError) {
      return;
    }

    // 日付整合性エラーがある場合は送信をブロック
    if (hasErrors) {
      console.error('日付整合性エラーがあります:', errors);
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    const getRequiredString = (key: string): string => {
      const value = formData.get(key);
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error(`必須項目: ${key}`);
      }
      return value;
    };

    const getOptionalString = (key: string): string | undefined => {
      const value = formData.get(key);
      return typeof value === 'string' && value.trim() ? value : undefined;
    };

    let imageUrl = typeof thumbnail === 'string' ? thumbnail : undefined;

    // 新しい画像がアップロードされた場合
    if (thumbnail instanceof File) {
      imageUrl = await uploadImage(thumbnail);

      // 編集時に古い画像があれば削除
      if (
        isEditing &&
        initialData.image_url &&
        typeof initialData.image_url === 'string'
      ) {
        await deleteOldImage(initialData.image_url);
      }
    }

    let audioUrl = typeof audioFile === 'string' ? audioFile : undefined;

    // 新しい音声ファイルがアップロードされた場合
    if (audioFile instanceof File) {
      audioUrl = await uploadAudioFile(audioFile);

      // 編集時に古い音声ファイルがあれば削除
      if (
        isEditing &&
        initialData.radio_url &&
        typeof initialData.radio_url === 'string'
      ) {
        await deleteOldAudioFile(initialData.radio_url);
      }
    }

    const data: RadioFormData = {
      radio_name: getRequiredString('radio_name'),
      radio_url: audioUrl,
      publish_start_at: getOptionalString('publish_start_at'),
      publish_end_at: getOptionalString('publish_end_at'),
      radio_description: description || undefined,
      image_url: imageUrl,
      selectedGroupIds,
      is_draft: isDraft,
    };

    try {
      await onSubmit(data);
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

  const handleGroupChange = useCallback((groupId: string, checked: boolean) => {
    setSelectedGroupIds((prev) =>
      checked ? [...prev, groupId] : prev.filter((id) => id !== groupId),
    );
  }, []);

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
        <h1
          className={css({
            fontSize: '2xl',
            fontWeight: 'bold',
            mb: '6',
            borderBottom: '1px solid',
            borderColor: 'gray.200',
            pb: '4',
          })}
        >
          {isEditing ? 'ラジオの編集' : 'ラジオの作成'}
        </h1>

        <form onSubmit={handleSubmit}>
          {/* ラジオ名 */}
          <div className={css({ mb: '6' })}>
            <label
              htmlFor="radio_name"
              className={css({
                display: 'block',
                mb: '2',
                fontWeight: 'semibold',
                color: 'gray.700',
              })}
            >
              ラジオ名 <span className={css({ color: 'red.500' })}>*</span>
            </label>
            <Input
              type="text"
              id="radio_name"
              name="radio_name"
              defaultValue={initialData.radio_name}
              required
            />
          </div>

          {/* サムネイル画像 */}
          <div className={css({ mb: '4' })}>
            <label
              htmlFor="thumbnail"
              className={css({
                display: 'block',
                mb: '2',
                fontWeight: 'medium',
              })}
            >
              サムネイル
            </label>
            <div
              className={css({
                display: 'flex',
                flexDir: { base: 'column', md: 'row' },
                gap: '4',
                alignItems: { md: 'center' },
              })}
            >
              <div
                className={css({
                  width: '200px',
                  height: '150px',
                  border: '1px dashed',
                  borderColor: 'gray.300',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  bg: 'white',
                })}
              >
                {thumbnailPreview ? (
                  <Image
                    src={thumbnailPreview}
                    alt="サムネイルプレビュー"
                    fill
                    sizes="200px"
                    style={{ objectFit: 'cover' }}
                    priority
                    unoptimized={thumbnailPreview.startsWith('blob:')}
                  />
                ) : (
                  <span className={css({ color: 'gray.500' })}>プレビュー</span>
                )}
              </div>
              <div className={css({ flex: '1' })}>
                <label
                  htmlFor="thumbnail"
                  className={css({
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2',
                    bg: 'blue.500',
                    color: 'white',
                    px: '4',
                    py: '2',
                    borderRadius: 'md',
                    cursor: 'pointer',
                    fontSize: 'sm',
                    fontWeight: 'medium',
                    _hover: { bg: 'blue.600' },
                    transition: 'background-color 0.2s',
                  })}
                >
                  画像を選択
                  <input
                    id="thumbnail"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      handleThumbnailChange(file || null);
                    }}
                    className={css({
                      position: 'absolute',
                      width: '1px',
                      height: '1px',
                      padding: '0',
                      margin: '-1px',
                      overflow: 'hidden',
                      clip: 'rect(0, 0, 0, 0)',
                      whiteSpace: 'nowrap',
                      border: '0',
                    })}
                  />
                </label>
                {imageError && (
                  <p
                    className={css({
                      color: 'red.500',
                      fontSize: 'sm',
                      mt: '2',
                    })}
                  >
                    {imageError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 音声ファイル */}
          <div className={css({ mb: '6' })}>
            <span
              className={css({
                display: 'block',
                mb: '2',
                fontWeight: 'semibold',
                color: 'gray.700',
              })}
            >
              音声ファイル
            </span>
            <label
              htmlFor="audio_file"
              className={css({
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2',
                bg: 'blue.500',
                color: 'white',
                px: '4',
                py: '2',
                borderRadius: 'md',
                cursor: 'pointer',
                fontSize: 'sm',
                fontWeight: 'medium',
                _hover: { bg: 'blue.600' },
                transition: 'background-color 0.2s',
              })}
            >
              音声を選択
              <input
                type="file"
                id="audio_file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  handleAudioFileChange(file || null);
                }}
                className={css({
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  padding: '0',
                  margin: '-1px',
                  overflow: 'hidden',
                  clip: 'rect(0, 0, 0, 0)',
                  whiteSpace: 'nowrap',
                  border: '0',
                })}
              />
            </label>
            {audioError && (
              <p className={css({ color: 'red.500', fontSize: 'sm', mt: '2' })}>
                {audioError}
              </p>
            )}
            {audioFile && (
              <div className={css({ mt: '4' })}>
                {typeof audioFile === 'string' ? (
                  <div>
                    <p
                      className={css({
                        fontSize: 'sm',
                        color: 'gray.600',
                        mb: '2',
                      })}
                    >
                      現在のファイル:
                    </p>
                    <audio
                      controls
                      src={audioFile}
                      className={css({ w: 'full', maxW: '500px' })}
                    >
                      <track kind="captions" />
                    </audio>
                  </div>
                ) : (
                  <div>
                    <p className={css({ fontSize: 'sm', color: 'gray.600' })}>
                      選択されたファイル: {audioFile.name} (
                      {formatFileSize(audioFile.size)})
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 日付整合性エラー表示 */}
          {hasErrors && <DateValidationErrors errors={errors} />}

          {/* 投稿開始 */}
          <div className={css({ mb: '6' })}>
            <label
              htmlFor="publish_start_at"
              className={css({
                display: 'block',
                mb: '2',
                fontWeight: 'semibold',
                color: 'gray.700',
              })}
            >
              投稿開始
            </label>
            <Input
              type="datetime-local"
              id="publish_start_at"
              name="publish_start_at"
              autoComplete="one-time-code"
              value={publishStartAt}
              onChange={(e) => setPublishStartAt(e.target.value)}
              className={css({
                borderColor: hasFieldError('start') ? 'red.500' : undefined,
              })}
            />
            <FieldDateError errors={errors} field="start" />
          </div>

          {/* 投稿終了 */}
          <div className={css({ mb: '6' })}>
            <div
              className={css({
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: '2',
              })}
            >
              <label
                htmlFor="publish_end_at"
                className={css({
                  fontWeight: 'semibold',
                  color: 'gray.700',
                })}
              >
                投稿終了
              </label>
              <UnlimitedToggle
                checked={isUnlimited}
                onChange={handleUnlimitedChange}
              />
            </div>
            <Input
              type="datetime-local"
              id="publish_end_at"
              name="publish_end_at"
              autoComplete="one-time-code"
              value={isUnlimited ? '' : publishEndAt.slice(0, 16)}
              onChange={(e) => setPublishEndAt(e.target.value)}
              disabled={isUnlimited}
              className={css({
                opacity: isUnlimited ? 0.5 : 1,
                borderColor: hasFieldError('end') ? 'red.500' : undefined,
              })}
            />
            {isUnlimited && (
              <input
                type="hidden"
                name="publish_end_at"
                value={DEFAULT_PUBLISH_END_DATE}
              />
            )}
            <FieldDateError errors={errors} field="end" />
          </div>

          {/* 説明 */}
          <div className={css({ mb: '6' })}>
            <label
              htmlFor="radio_description"
              className={css({
                display: 'block',
                mb: '2',
                fontWeight: 'semibold',
                color: 'gray.700',
              })}
            >
              説明
            </label>
            <RichTextEditor
              name="radio_description"
              value={description}
              onChange={setDescription}
              placeholder="説明文を入力してください..."
            />
          </div>

          {/* 公開グループ */}
          <div className={css({ mb: '6' })}>
            <div
              className={css({
                display: 'block',
                mb: '2',
                fontWeight: 'semibold',
                color: 'gray.700',
              })}
            >
              公開グループ
            </div>
            <p
              className={css({
                fontSize: 'sm',
                color: 'red.600',
                mb: '2',
              })}
            >
              ※何も選ばない場合は全員に表示されます
            </p>
            <div
              className={css({
                border: '1px solid',
                borderColor: 'gray.300',
                borderRadius: 'md',
                p: '2',
                maxHeight: '120px',
                overflowY: 'auto',
                bg: 'white',
              })}
            >
              {groups.map((group) => (
                <label
                  key={group.group_id}
                  className={css({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2',
                    cursor: 'pointer',
                    mb: '2',
                    _last: {
                      mb: '0',
                    },
                  })}
                >
                  <input
                    type="checkbox"
                    value={group.group_id}
                    checked={selectedGroupIds.includes(group.group_id)}
                    onChange={(e) =>
                      handleGroupChange(group.group_id, e.target.checked)
                    }
                  />
                  <span>{group.title}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ボタン */}
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
