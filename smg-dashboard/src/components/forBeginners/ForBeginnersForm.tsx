import { createClient } from '@/lib/supabase/client';
import {
  type VimeoUploadState,
  createVimeoUploadState,
  updateVimeoUploadState,
  uploadVideoToVimeo,
} from '@/lib/vimeo/upload';
import { css } from '@/styled-system/css';
import { useCallback, useEffect, useState } from 'react';
import { FormActionButtons } from '../ui/FormActionButtons';
import { RichTextEditor } from '../ui/RichTextEditor';
import { BeginnerFileUploader } from './BeginnerFileUploader';
import type {
  BeginnerGuideFile,
  ForBeginnersFormSubmitData,
  PartialForBeginnersFormData,
} from './types';

type ForBeginnersFormProps = {
  isEditing: boolean;
  initialData?: PartialForBeginnersFormData;
  onSubmit: (data: ForBeginnersFormSubmitData, isDraft?: boolean) => void;
  onCancel: () => void;
  onDelete?: () => void;
};

export const ForBeginnersForm = ({
  isEditing,
  initialData = {},
  onSubmit,
  onCancel,
  onDelete,
}: ForBeginnersFormProps) => {
  const [moviePreview, setMoviePreview] = useState<string | null>(null);
  const [movieFileName, setMovieFileName] = useState<string | null>(null);
  const [movieUrlPreview, setMovieUrlPreview] = useState<string>('');
  const [description, setDescription] = useState<string>(
    initialData.description || '',
  );
  const [files, setFiles] = useState<BeginnerGuideFile[]>(
    initialData.files || [],
  );

  // 動画アップロード状態
  const [videoUploadState, setVideoUploadState] = useState<VimeoUploadState>(
    createVimeoUploadState(),
  );

  const supabase = createClient();

  useEffect(() => {
    if (initialData.movieUrl) {
      setMovieUrlPreview(initialData.movieUrl);
    }
    if (initialData.description) {
      setDescription(initialData.description);
    }
  }, [initialData.movieUrl, initialData.description]);

  const handleFilesChange = useCallback((updatedFiles: BeginnerGuideFile[]) => {
    setFiles(updatedFiles);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const getRequiredString = (key: string): string => {
      const value = formData.get(key);
      if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`Missing required field: ${key}`);
      }
      return value.trim();
    };

    const getOptionalString = (key: string): string | null => {
      const value = formData.get(key);
      return typeof value === 'string' && value.trim() !== ''
        ? value.trim()
        : null;
    };

    const data: ForBeginnersFormSubmitData = {
      guide_item_id: initialData.guide_item_id || '',
      title: getRequiredString('title'),
      description: description,
      movieUrl: getOptionalString('movieUrl') || '',
      movieFile: form.movieFile.files?.[0],
      files: files,
    };

    onSubmit(data, false);
  };

  const handleSaveDraft = async () => {
    const form = document.querySelector('form');
    if (form instanceof HTMLFormElement) {
      const formData = new FormData(form);

      const getOptionalString = (key: string): string | null => {
        const value = formData.get(key);
        return typeof value === 'string' && value.trim() !== ''
          ? value.trim()
          : null;
      };

      const data: ForBeginnersFormSubmitData = {
        guide_item_id: initialData.guide_item_id || '',
        title: formData.get('title')?.toString() || '',
        description: description,
        movieUrl: getOptionalString('movieUrl') || '',
        movieFile: form.movieFile.files?.[0],
        files: files,
      };

      try {
        await onSubmit(data, true);
      } catch (error) {
        console.error('下書き保存エラー:', error);
      }
    }
  };

  const handleMovieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMoviePreview(URL.createObjectURL(file));
      setMovieFileName(file.name);
      setVideoUploadState(
        updateVimeoUploadState(videoUploadState, {
          file: file,
          uploading: false,
          progress: 0,
          error: null,
        }),
      );
    } else {
      setMoviePreview(null);
      setMovieFileName(null);
      setVideoUploadState(createVimeoUploadState());
    }
  };

  // Vimeoアップロード処理
  const handleVimeoUpload = async () => {
    if (!videoUploadState.file) {
      setVideoUploadState(
        updateVimeoUploadState(videoUploadState, {
          error: '動画ファイルを選択してください',
        }),
      );
      return;
    }

    setVideoUploadState(
      updateVimeoUploadState(videoUploadState, {
        uploading: true,
        progress: 0,
        error: null,
      }),
    );

    try {
      const videoUrl = await uploadVideoToVimeo(videoUploadState.file, {
        title: '初めての方への動画',
        description: '',
        onProgress: (progress) => {
          setVideoUploadState((prevState) =>
            updateVimeoUploadState(prevState, { progress }),
          );
        },
        onError: (error) => {
          setVideoUploadState((prevState) =>
            updateVimeoUploadState(prevState, { error }),
          );
        },
      });

      setVideoUploadState((prevState) =>
        updateVimeoUploadState(prevState, {
          uploading: false,
          progress: 100,
          error: null,
        }),
      );

      setMovieUrlPreview(videoUrl);

      const movieUrlInput = document.getElementById(
        'movieUrl',
      ) as HTMLInputElement;
      if (movieUrlInput) {
        movieUrlInput.value = videoUrl;
      }
    } catch (error) {
      console.error('動画アップロードエラー:', error);
      setVideoUploadState((prevState) =>
        updateVimeoUploadState(prevState, {
          uploading: false,
          progress: 0,
          error:
            error instanceof Error
              ? error.message
              : '動画のアップロードに失敗しました',
        }),
      );
    }
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const isVimeoUrl = (url: string) => {
    return url.includes('vimeo.com');
  };

  const extractYouTubeId = (url: string) => {
    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : '';
  };

  const extractVimeoId = (url: string) => {
    const regExp = /vimeo\.com\/(?:.*\/)?(\d+)(?:\/([a-zA-Z0-9]+))?/;
    const match = url.match(regExp);
    if (match) {
      const videoId = match[1];
      const hash = match[2];
      return { videoId, hash };
    }
    return { videoId: '', hash: null };
  };

  return (
    <div className={css({ mx: 'auto', maxW: '900px', p: '3' })}>
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
        <h1 className={titleStyle}>
          {isEditing ? '初めての方への編集' : '初めての方への作成'}
        </h1>

        <form
          onSubmit={handleSubmit}
          className={css({ display: 'flex', flexDir: 'column', gap: '6' })}
        >
          <section>
            <h2 className={sectionHeaderStyle}>初めての方への内容</h2>

            {/* タイトル */}
            <FormField label="タイトル" required htmlFor="title">
              <input
                id="title"
                name="title"
                type="text"
                required
                className={inputStyle}
                defaultValue={initialData.title || ''}
              />
            </FormField>

            {/* 説明文 */}
            <FormField label="説明文" required htmlFor="description">
              <RichTextEditor
                name="description"
                value={description}
                onChange={setDescription}
                placeholder="説明文を入力してください..."
              />
            </FormField>

            <FormField label="動画ファイル" htmlFor="movieFile">
              <label className={uploadButtonStyle}>
                動画ファイルを選択
                <input
                  id="movieFile"
                  name="movieFile"
                  type="file"
                  accept="video/*,.mp4,.avi,.mov,.wmv,.flv,.mkv,.webm,.3gp,.m4v"
                  className={hiddenInputStyle}
                  onChange={handleMovieChange}
                />
              </label>
              {movieFileName && (
                <div className={fileNameStyle}>
                  選択されたファイル: {movieFileName}
                </div>
              )}

              {/* Vimeoアップロードボタンとステータス */}
              {videoUploadState.file && (
                <div className={css({ mt: '3' })}>
                  <button
                    type="button"
                    onClick={handleVimeoUpload}
                    disabled={videoUploadState.uploading}
                    className={css({
                      display: 'inline-block',
                      padding: '0.5rem 1rem',
                      borderRadius: 'md',
                      backgroundColor: videoUploadState.uploading
                        ? 'gray.400'
                        : 'green.500',
                      color: 'white',
                      cursor: videoUploadState.uploading
                        ? 'not-allowed'
                        : 'pointer',
                      fontSize: 'sm',
                      _hover: {
                        backgroundColor: videoUploadState.uploading
                          ? 'gray.400'
                          : 'green.600',
                      },
                      mr: '2',
                    })}
                  >
                    {videoUploadState.uploading
                      ? 'Vimeoにアップロード中...'
                      : 'Vimeoにアップロード'}
                  </button>

                  {videoUploadState.uploading && (
                    <div className={css({ mt: '3' })}>
                      <div
                        className={css({
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: '2',
                        })}
                      >
                        <span
                          className={css({ fontSize: 'sm', color: 'gray.600' })}
                        >
                          {videoUploadState.progress <= 10
                            ? 'アップロード準備中...'
                            : 'Vimeoにアップロード中...'}
                        </span>
                        <span
                          className={css({
                            fontSize: 'sm',
                            color: 'gray.600',
                            fontWeight: 'medium',
                          })}
                        >
                          {videoUploadState.progress}%
                        </span>
                      </div>
                      <div
                        className={css({
                          w: 'full',
                          bg: 'gray.200',
                          h: '2',
                          rounded: 'full',
                          overflow: 'hidden',
                        })}
                      >
                        <div
                          className={css({
                            h: 'full',
                            bg: 'blue.500',
                            transition: 'width 0.3s ease-in-out',
                          })}
                          style={{ width: `${videoUploadState.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {videoUploadState.error && (
                    <div
                      className={css({
                        mt: '2',
                        p: '2',
                        bg: 'red.50',
                        borderRadius: 'md',
                        color: 'red.700',
                        fontSize: 'sm',
                      })}
                    >
                      エラー: {videoUploadState.error}
                    </div>
                  )}

                  {videoUploadState.progress === 100 &&
                    !videoUploadState.error && (
                      <div
                        className={css({
                          mt: '2',
                          p: '2',
                          bg: 'green.50',
                          borderRadius: 'md',
                          color: 'green.700',
                          fontSize: 'sm',
                        })}
                      >
                        Vimeoへのアップロードが完了しました
                      </div>
                    )}
                </div>
              )}
            </FormField>

            {moviePreview && !isVimeoUrl(movieUrlPreview) && (
              <div className={css({ my: '4' })}>
                <video
                  controls
                  src={moviePreview}
                  className={css({
                    width: '100%',
                    maxWidth: '500px',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    mx: 'auto',
                    display: 'block',
                    borderRadius: 'md',
                    mb: '2',
                  })}
                >
                  <track
                    kind="captions"
                    src=""
                    label={movieFileName || 'キャプション'}
                    default
                  />
                </video>
                <button
                  type="button"
                  onClick={() => {
                    setMoviePreview(null);
                    setMovieFileName(null);
                  }}
                  className={deleteButtonStyle}
                >
                  ファイルプレビューを削除
                </button>
              </div>
            )}

            {/* 動画URL */}
            <FormField label="動画URL（任意）" htmlFor="movieUrl">
              <input
                id="movieUrl"
                name="movieUrl"
                type="url"
                className={inputStyle}
                defaultValue={initialData.movieUrl || ''}
                onChange={(e) => setMovieUrlPreview(e.target.value)}
              />
            </FormField>

            {movieUrlPreview && (
              <div className={css({ my: '4' })}>
                {isYouTubeUrl(movieUrlPreview) ? (
                  <iframe
                    title={`preview_${movieUrlPreview}`}
                    width="100%"
                    height="400"
                    src={`https://www.youtube.com/embed/${extractYouTubeId(movieUrlPreview)}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className={css({ mb: '2' })}
                  />
                ) : isVimeoUrl(movieUrlPreview) ? (
                  (() => {
                    const vimeoData = extractVimeoId(movieUrlPreview);
                    const embedUrl = vimeoData.hash
                      ? `https://player.vimeo.com/video/${vimeoData.videoId}?h=${vimeoData.hash}`
                      : `https://player.vimeo.com/video/${vimeoData.videoId}`;

                    return (
                      <iframe
                        title={`preview_${movieUrlPreview}`}
                        width="100%"
                        height="400"
                        src={embedUrl}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        className={css({ mb: '2' })}
                      />
                    );
                  })()
                ) : (
                  <video
                    controls
                    src={movieUrlPreview}
                    className={css({
                      width: '100%',
                      maxWidth: '500px',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      mx: 'auto',
                      display: 'block',
                      mb: '2',
                    })}
                  >
                    <track
                      kind="captions"
                      src=""
                      label="キャプション"
                      default
                    />
                  </video>
                )}
                <button
                  type="button"
                  onClick={() => setMovieUrlPreview('')}
                  className={deleteButtonStyle}
                >
                  URLプレビューを削除
                </button>
              </div>
            )}
          </section>

          {/* 資料ファイル（複数対応） */}
          <section>
            <BeginnerFileUploader
              initialFiles={initialData.files}
              onChange={handleFilesChange}
            />
          </section>

          <FormActionButtons
            isEditing={isEditing}
            onCancel={onCancel}
            onSaveDraft={handleSaveDraft}
            onDelete={onDelete}
          />
        </form>
      </div>
    </div>
  );
};

const titleStyle = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  mb: '6',
  textAlign: 'center',
  borderBottom: '1px solid',
  borderColor: 'gray.200',
  pb: '4',
});

const sectionHeaderStyle = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  mb: '4',
  borderLeft: '4px solid',
  borderColor: 'blue.500',
  pl: '2',
});

const inputStyle = css({
  border: '1px solid',
  borderColor: 'gray.300',
  p: '2',
  borderRadius: 'md',
  width: '100%',
  outline: 'none',
  _focus: { borderColor: 'blue.500' },
});

const hiddenInputStyle = css({
  display: 'none',
});

const uploadButtonStyle = css({
  display: 'inline-block',
  padding: '0.5rem 1rem',
  borderRadius: 'md',
  backgroundColor: 'blue.500',
  color: 'white',
  cursor: 'pointer',
  fontSize: 'sm',
  _hover: { backgroundColor: 'blue.600' },
});

const fileNameStyle = css({
  marginTop: '8px',
  fontSize: 'sm',
  color: 'gray.700',
});

const deleteButtonStyle = css({
  display: 'inline-block',
  padding: '0.25rem 0.75rem',
  borderRadius: 'md',
  backgroundColor: 'red.500',
  color: 'white',
  fontSize: 'sm',
  cursor: 'pointer',
  _hover: { backgroundColor: 'red.600' },
});

const FormField = ({
  label,
  required,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor: string;
  children: React.ReactNode;
}) => (
  <div className={css({ mb: '4' })}>
    <label
      htmlFor={htmlFor}
      className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
    >
      {label} {required && <span className={css({ color: 'red.500' })}>*</span>}
    </label>
    {children}
  </div>
);
