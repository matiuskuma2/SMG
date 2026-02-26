'use client';

import type {
  ArchiveVideo,
  VideoUploaderProps,
} from '@/components/archive/archive';
import { Button } from '@/components/ui/button';
import {
  type VimeoUploadState,
  createVimeoUploadState,
  updateVimeoUploadState,
  uploadVideoToVimeo,
} from '@/lib/vimeo/upload';
import { css } from '@/styled-system/css';
import { useEffect, useState } from 'react';
import { FaPlus, FaSpinner, FaTrash, FaUpload } from 'react-icons/fa6';

export function VideoUploader({
  videos,
  onVideosChange,
  isSubmitting,
  themes = [],
}: VideoUploaderProps) {
  const [videoStates, setVideoStates] = useState<VimeoUploadState[]>([]);

  // 動画を追加する関数
  const addVideo = () => {
    const newVideo: ArchiveVideo = {
      video_id: '',
      archive_id: '',
      video_url: '',
      video_image_url: null,
      display_order: videos.length + 1,
      created_at: null,
      updated_at: null,
      deleted_at: null,
      theme_id: null,
      is_sawabe_instructor: false,
    };

    onVideosChange((prevVideos) => [...prevVideos, newVideo]);
    setVideoStates([...videoStates, createVimeoUploadState()]);
  };

  // 動画を削除する関数
  const removeVideo = (index: number) => {
    const newVideos = videos.filter((_, i) => i !== index);
    const newVideoStates = videoStates.filter((_, i) => i !== index);

    // display_orderを振り直す
    newVideos.forEach((video, i) => {
      video.display_order = i + 1;
    });

    onVideosChange((prevVideos) => {
      const filtered = prevVideos.filter((_, i) => i !== index);
      // display_orderを再設定
      return filtered.map((video, i) => ({ ...video, display_order: i + 1 }));
    });
    setVideoStates(newVideoStates);
  };

  // 動画ファイル選択処理
  const handleVideoFileChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      const newVideoStates = [...videoStates];

      // ファイル形式の検証
      if (!selectedFile.type.startsWith('video/')) {
        newVideoStates[index] = updateVimeoUploadState(newVideoStates[index], {
          file: null,
          error: '動画ファイルのみ選択可能です',
        });
        setVideoStates(newVideoStates);
        e.target.value = ''; // ファイル選択をクリア
        return;
      }

      // ファイルサイズの検証（15GB制限）
      const maxSize = 15 * 1024 * 1024 * 1024; // 15GB
      if (selectedFile.size > maxSize) {
        newVideoStates[index] = updateVimeoUploadState(newVideoStates[index], {
          file: null,
          error: 'ファイルサイズが15GBを超えています',
        });
        setVideoStates(newVideoStates);
        e.target.value = ''; // ファイル選択をクリア
        return;
      }

      newVideoStates[index] = updateVimeoUploadState(newVideoStates[index], {
        file: selectedFile,
        error: null,
      });
      setVideoStates(newVideoStates);
    }
  };

  // 動画アップロード処理（直接アップロード方式）
  const handleVideoUpload = async (index: number) => {
    const videoState = videoStates[index];

    if (!videoState?.file) {
      const newVideoStates = [...videoStates];
      newVideoStates[index] = updateVimeoUploadState(newVideoStates[index], {
        error: '動画ファイルを選択してください',
      });
      setVideoStates(newVideoStates);
      return;
    }

    if (videoState.uploading) {
      return;
    }

    // アップロード開始時の状態更新
    setVideoStates((prevStates) => {
      const newStates = [...prevStates];
      newStates[index] = updateVimeoUploadState(newStates[index], {
        uploading: true,
        progress: 0,
        error: null,
      });
      return newStates;
    });

    try {
      const videoUrl = await uploadVideoToVimeo(videoState.file, {
        title: `イベントアーカイブ動画 ${index + 1}`,
        description: '',
        onProgress: (progress) => {
          setVideoStates((prevStates) => {
            const newStates = [...prevStates];
            newStates[index] = updateVimeoUploadState(newStates[index], {
              progress,
            });
            return newStates;
          });
        },
        onError: (error) => {
          setVideoStates((prevStates) => {
            const newStates = [...prevStates];
            newStates[index] = updateVimeoUploadState(newStates[index], {
              error,
            });
            return newStates;
          });
        },
      });

      // アップロード完了時の状態更新
      setVideoStates((prevStates) => {
        const newStates = [...prevStates];
        newStates[index] = updateVimeoUploadState(newStates[index], {
          uploading: false,
          progress: 100,
          error: null,
        });
        return newStates;
      });

      // 動画URLを更新
      onVideosChange((prevVideos) => {
        const newVideos = [...prevVideos];
        newVideos[index] = {
          ...newVideos[index],
          video_url: videoUrl,
        };
        return newVideos;
      });
    } catch (error) {
      setVideoStates((prevStates) => {
        const newStates = [...prevStates];
        newStates[index] = updateVimeoUploadState(newStates[index], {
          uploading: false,
          progress: 0,
          error:
            error instanceof Error
              ? error.message
              : '動画のアップロードに失敗しました',
        });
        return newStates;
      });
    }
  };

  // 動画状態を同期する
  useEffect(() => {
    if (videoStates.length !== videos.length) {
      const newVideoStates = videos.map(
        (_, index) => videoStates[index] || createVimeoUploadState(),
      );
      setVideoStates(newVideoStates);
    }
  }, [videoStates, videos]);

  // Vimeo埋め込みURLを生成する関数
  const getVimeoEmbedUrl = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)(?:\/([a-zA-Z0-9]+))?/);
    if (match) {
      const videoId = match[1];
      const hash = match[2] ? `?h=${match[2]}` : '';
      return `https://player.vimeo.com/video/${videoId}${hash}`;
    }
    return url; // 無効な場合は元のURLを返す
  };

  return (
    <div
      className={css({
        bg: 'white',
        p: '6',
        rounded: 'md',
      })}
    >
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: '4',
          borderBottom: '1px solid',
          borderColor: 'gray.200',
          pb: '2',
        })}
      >
        <h2
          className={css({
            fontSize: 'xl',
            fontWeight: 'bold',
          })}
        >
          動画 ({videos.length})
        </h2>

        <Button
          type="button"
          onClick={() => {
            addVideo();
          }}
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '2',
            bg: 'blue.600',
            color: 'white',
            px: '3',
            py: '2',
            rounded: 'md',
            _hover: { bg: 'blue.700' },
          })}
        >
          <FaPlus size={12} />
          動画を追加
        </Button>
      </div>

      <div
        className={css({ display: 'flex', flexDirection: 'column', gap: '4' })}
      >
        {videos.map((video, index) => {
          const videoState = videoStates[index];

          return (
            <div
              key={video.video_id || video.display_order}
              className={css({
                border: '1px solid',
                borderColor: 'gray.200',
                p: '4',
                rounded: 'md',
              })}
            >
              <div
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: '3',
                })}
              >
                <h3 className={css({ fontWeight: 'medium' })}>
                  動画 {index + 1}
                </h3>

                <Button
                  type="button"
                  onClick={() => {
                    removeVideo(index);
                  }}
                  className={css({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2',
                    bg: 'red.600',
                    color: 'white',
                    px: '2',
                    py: '1',
                    rounded: 'md',
                    _hover: { bg: 'red.700' },
                  })}
                  disabled={videoState?.uploading}
                >
                  <FaTrash size={12} />
                  削除
                </Button>
              </div>

              {!video.video_url ? (
                <div>
                  <div
                    className={css({
                      display: 'flex',
                      gap: '2',
                      alignItems: 'center',
                      mb: '3',
                    })}
                  >
                    <label
                      htmlFor={`video-upload-${index}`}
                      className={css({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2',
                        p: '2',
                        border: '1px dashed',
                        borderColor: 'gray.300',
                        rounded: 'md',
                        cursor: 'pointer',
                        _hover: { bg: 'gray.50' },
                        flex: '1',
                      })}
                    >
                      <FaUpload
                        size={16}
                        className={css({ color: 'gray.500' })}
                      />
                      <span>
                        {videoState?.file
                          ? videoState.file.name
                          : 'クリックして動画を選択'}
                      </span>
                      <input
                        id={`video-upload-${index}`}
                        type="file"
                        accept="video/*,.mp4,.avi,.mov,.wmv,.flv,.mkv,.webm,.3gp,.m4v"
                        onChange={(e) => {
                          handleVideoFileChange(index, e);
                        }}
                        className={css({ display: 'none' })}
                        disabled={videoState?.uploading}
                      />
                    </label>

                    <Button
                      type="button"
                      onClick={() => {
                        handleVideoUpload(index);
                      }}
                      className={css({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2',
                        bg: 'blue.600',
                        color: 'white',
                        px: '3',
                        py: '2',
                        rounded: 'md',
                        _hover: { bg: 'blue.700' },
                        whiteSpace: 'nowrap',
                      })}
                      disabled={!videoState?.file || videoState?.uploading}
                    >
                      {videoState?.uploading ? (
                        <>
                          <FaSpinner
                            size={14}
                            className={css({
                              animation: 'spin 1s linear infinite',
                            })}
                          />
                          アップロード中...
                        </>
                      ) : (
                        <>
                          <FaUpload size={14} /> Vimeoにアップロード
                        </>
                      )}
                    </Button>
                  </div>

                  {videoState?.uploading && (
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
                          {videoState.progress <= 10
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
                          {videoState.progress}%
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
                          style={{ width: `${videoState.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {videoState?.error && (
                    <div
                      className={css({
                        p: '2',
                        bg: 'red.50',
                        rounded: 'md',
                        color: 'red.700',
                        fontSize: 'sm',
                        mb: '3',
                        mt: '3',
                      })}
                    >
                      {videoState.error}
                    </div>
                  )}
                  {/* アップロード完了メッセージ */}
                  {videoState?.progress === 100 &&
                    !videoState.uploading &&
                    !videoState.error && (
                      <div
                        className={css({
                          p: '2',
                          bg: 'green.50',
                          rounded: 'md',
                          color: 'green.700',
                          fontSize: 'sm',
                          mb: '3',
                          mt: '3',
                        })}
                      >
                        動画のアップロードが完了しました
                      </div>
                    )}
                </div>
              ) : (
                <div>
                  <div
                    className={css({
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: '3',
                      bg: 'green.50',
                      rounded: 'md',
                      border: '1px solid',
                      borderColor: 'green.200',
                    })}
                  >
                    <div
                      className={css({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2',
                      })}
                    >
                      <span className={css({ color: 'green.600' })}>✓</span>
                      <span className={css({ color: 'green.700' })}>
                        動画のアップロードが完了しました
                      </span>
                    </div>

                    <Button
                      type="button"
                      onClick={() => {
                        const updatedVideos = [...videos];
                        updatedVideos[index] = {
                          ...updatedVideos[index],
                          video_url: '',
                        };
                        onVideosChange(updatedVideos);
                      }}
                      className={css({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2',
                        bg: 'gray.600',
                        color: 'white',
                        px: '2',
                        py: '1',
                        rounded: 'md',
                        _hover: { bg: 'gray.700' },
                      })}
                      disabled={isSubmitting}
                    >
                      <FaTrash size={12} />
                      削除
                    </Button>
                  </div>

                  {video.video_url && (
                    <div className={css({ mt: '3', color: 'blue.600' })}>
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {video.video_url}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* テーマ選択・沢辺講師フラグ（定例会の時のみ表示） */}
              {themes.length > 0 && (
                <>
                  {/* テーマ選択 */}
                  <div className={css({ mt: '3' })}>
                    <label
                      htmlFor={`video-theme-${index}`}
                      className={css({
                        display: 'block',
                        mb: '1',
                        fontSize: 'sm',
                      })}
                    >
                      テーマ
                    </label>
                    <select
                      id={`video-theme-${index}`}
                      value={video.theme_id || ''}
                      onChange={(e) => {
                        const updatedVideos = [...videos];
                        updatedVideos[index] = {
                          ...updatedVideos[index],
                          theme_id: e.target.value || null,
                        };
                        onVideosChange(updatedVideos);
                      }}
                      className={css({
                        w: 'full',
                        p: '2',
                        border: '1px solid',
                        borderColor: 'gray.300',
                        borderRadius: 'md',
                        bg: 'white',
                      })}
                    >
                      <option value="">選択してください</option>
                      {themes.map((theme) => (
                        <option key={theme.theme_id} value={theme.theme_id}>
                          {theme.theme_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 沢辺講師フラグ */}
                  <div className={css({ mt: '4' })}>
                    <label
                      className={css({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2',
                        cursor: 'pointer',
                      })}
                    >
                      <input
                        type="checkbox"
                        checked={video.is_sawabe_instructor || false}
                        onChange={(e) => {
                          const updatedVideos = [...videos];
                          updatedVideos[index] = {
                            ...updatedVideos[index],
                            is_sawabe_instructor: e.target.checked,
                          };
                          onVideosChange(updatedVideos);
                        }}
                        className={css({ cursor: 'pointer' })}
                      />
                      <span className={css({ fontSize: 'sm' })}>沢辺講師</span>
                    </label>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {videos.length === 0 && (
          <div
            className={css({
              textAlign: 'center',
              p: '6',
              color: 'gray.500',
            })}
          >
            動画がありません。上の「動画を追加」ボタンから追加してください。
          </div>
        )}
      </div>
    </div>
  );
}
