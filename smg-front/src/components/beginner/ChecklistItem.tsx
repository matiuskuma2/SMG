import { css } from '@/styled-system/css';
import { Download, FileText, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { GuideFileType, GuideItemType, GuideVideoType } from './types';
import { RichContentDisplay } from '@/features/editer/RichContentDisplay';
import { useIsInstructor } from '@/hooks/useIsInstructor';


type ChecklistItemProps = {
  item: GuideItemType;
  videos: GuideVideoType[];
  files: GuideFileType[];
  isOpen: boolean;
  toggleAccordion: (id: string) => void;
  handleCheckboxChange: (id: string) => void;
};

// 動画URLがVimeoかどうかを判定する関数
const isVimeoUrl = (url: string): boolean => {
  return url.includes('vimeo.com');
};

// 動画URLがYouTubeかどうかを判定する関数
const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

// VimeoのURLを埋め込み用URLに変換
const convertVimeoToEmbedUrl = (url: string): string => {
  return url.replace(/https:\/\/vimeo\.com\/(\d+)(?:\/([a-zA-Z0-9]+))?.*/, 'https://player.vimeo.com/video/$1?h=$2&autoplay=0&title=0&byline=0&portrait=0&controls=1&loop=0&muted=0&show_title=0');
};

// YouTubeのURLを埋め込み用URLに変換
const convertYouTubeToEmbedUrl = (url: string): string => {
  // 通常のYouTubeURL: https://www.youtube.com/watch?v=VIDEO_ID
  if (url.includes('youtube.com/watch')) {
    const videoId = url.match(/[?&]v=([^&]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : url;
  }

  // 短縮URL: https://youtu.be/VIDEO_ID
  if (url.includes('youtu.be/')) {
    const videoId = url.match(/youtu\.be\/([^?&]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : url;
  }

  // 既に埋め込みURLの場合はそのまま返す
  if (url.includes('youtube.com/embed/')) {
    return url;
  }

  return url;
};

// 動画が埋め込み可能かどうかを判定
const isEmbeddableVideo = (url: string): boolean => {
  return isVimeoUrl(url) || isYouTubeUrl(url);
};

// 動画URLを埋め込み用URLに変換
const convertToEmbedUrl = (url: string): string => {
  if (isVimeoUrl(url)) {
    return convertVimeoToEmbedUrl(url);
  }
  if (isYouTubeUrl(url)) {
    return convertYouTubeToEmbedUrl(url);
  }
  return url;
};

// ファイルダウンロード関数
const downloadFile = async (fileUrl: string, fileName: string) => {
  try {
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('ファイルのダウンロードに失敗しました:', error);
  }
};

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  item,
  videos,
  files,
  isOpen,
  toggleAccordion,
  handleCheckboxChange
}) => {
  const { isInstructor, loading: isInstructorLoading } = useIsInstructor();
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

  const handleEdit = () => {
    const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://smg-dashboard.vercel.app';
    window.open(`${dashboardUrl}/forBeginners/edit/${item.guide_item_id}`, '_blank');
  };

  return (
    <div
      className={css({
        border: '1px solid',
        backgroundColor: '#FFF3E1',
        borderColor: 'gray.200',
        borderRadius: 'md',
        mb: 2,
        overflow: 'hidden'
      })}
    >
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          height: '55px'
        })}
      >
        <div className={css({
          writingMode: 'vertical-rl',
          textOrientation: 'upright',
          bg: '#9D7636',
          color: 'white',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'sm',
          fontWeight: 'bold',
          height: 'auto',
          minHeight: '100%',
          width: { base: '30px', md: '40px' },
          transition: 'width 0.3s ease'
        })}>
          必修
        </div>
        <div className={css({ flex: 1 })}>
          <div
            className={css({
              display: 'flex',
              alignItems: 'center',
              p: 3,
              bg: '#FFF3E1',
              cursor: 'pointer',
            })}
            onClick={(e) => {
              // チェックボックスがクリックされた場合は処理をスキップ
              if ((e.target as HTMLElement).tagName === 'INPUT') return;
              toggleAccordion(item.guide_item_id);
            }}
          >
            <div className={css({ mr: 3 })}>
              <input
                type="checkbox"
                checked={item.is_completed}
                onChange={(e) => {
                  e.stopPropagation();
                  handleCheckboxChange(item.guide_item_id);
                }}
                className={css({
                  w: { base: 5, md: 7 },
                  h: { base: 5, md: 7 },
                  accentColor: 'blue.500',
                  appearance: 'none',
                  bg: 'white',
                  border: '2px solid',
                  borderColor: 'gray.300',
                  borderRadius: 'md',
                  cursor: 'pointer',
                  position: 'relative',
                  '&:checked': {
                    bg: 'white',
                    borderColor: 'blue.500',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '100%',
                      height: '100%',
                      bg: 'blue.500',
                      maskImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 16 16\' fill=\'white\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M5.707 7.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4a1 1 0 0 0-1.414-1.414L7 8.586 5.707 7.293z\'/%3E%3C/svg%3E")',
                      maskSize: 'contain',
                      maskPosition: 'center',
                      maskRepeat: 'no-repeat',
                    }
                  }
                })}
              />
            </div>
            <div className={css({ flex: 1 })}>
              <span className={css({ fontWeight: 'medium' })}>{item.title}</span>
            </div>
            {!isInstructorLoading && isInstructor && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                className={css({
                  px: '3',
                  py: '1',
                  bg: 'blue.600',
                  color: 'white',
                  borderRadius: 'md',
                  fontSize: 'xs',
                  fontWeight: 'medium',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  mr: '2',
                  _hover: {
                    bg: 'blue.700',
                  },
                  _active: {
                    transform: 'scale(0.98)',
                  },
                })}
              >
                編集
              </button>
            )}
            <div
              className={css({
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              })}
            >
              <FaChevronDown />
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className={css({
          width: '100%',
          zIndex: 1
        })}>
          <div
            className={css({
              bg: 'gray.50',
              p: { base: 4, md: 6 },
              borderTop: '1px solid',
              borderColor: 'gray.200',
              transition: 'max-height 0.3s ease',
              maxHeight: isOpen ? '9999px' : '0',
              overflow: 'hidden',
              width: '100%'
            })}
          >
            <div className={css({ display: 'flex', flexDirection: 'column', gap: 6 })}>
              {item.description && (
                <div className={css({
                  fontSize: { base: 'sm', md: 'md' },
                  mb: 2
                })}>
                  <RichContentDisplay content={item.description} isHtml={true} />
                </div>
              )}

              {/* 動画セクション */}
              {videos.length > 0 && (
                <div className={css({ mb: 6 })}>
                  <h4 className={css({
                    fontWeight: 'bold',
                    fontSize: { base: 'md', md: 'lg' },
                    mb: 2
                  })}>
                    動画コンテンツ
                  </h4>
                  {videos.map((video, index) => (
                    <div key={video.video_id} className={css({ mb: index < videos.length - 1 ? 4 : 0 })}>
                      {isEmbeddableVideo(video.file_path) ? (
                        <div className={css({
                          width: '100%',
                          position: 'relative',
                          paddingBottom: '56.25%',
                          borderRadius: 'md',
                          overflow: 'hidden'
                        })}>
                          <iframe
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%"
                            }}
                            src={convertToEmbedUrl(video.file_path)}
                            title="動画プレーヤー"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div className={css({
                          display: 'flex',
                          alignItems: 'center',
                          p: 3,
                          border: '1px solid',
                          borderColor: 'gray.200',
                          borderRadius: 'md',
                          bg: 'white'
                        })}>
                          <div className={css({ mr: 3 })}>
                            <div className={css({
                              width: '40px',
                              height: '40px',
                              bg: 'red.500',
                              borderRadius: 'md',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white'
                            })}>
                              ▶
                            </div>
                          </div>
                          <div className={css({ flex: 1 })}>
                            <div className={css({ fontWeight: 'medium' })}>動画を見る</div>
                          </div>
                          <a
                            href={video.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={css({
                              px: 4,
                              py: 2,
                              bg: 'red.500',
                              color: 'white',
                              borderRadius: 'md',
                              textDecoration: 'none',
                              fontWeight: 'medium',
                              fontSize: 'sm',
                              _hover: {
                                bg: 'red.600'
                              }
                            })}
                          >
                            視聴する
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ファイルセクション */}
              {files.length > 0 && (
                <div className={css({ mb: 6 })}>
                  <h4 className={css({
                    fontWeight: 'bold',
                    fontSize: { base: 'md', md: 'lg' },
                    mb: 2
                  })}>
                    学習資料
                  </h4>
                  <div className={css({ display: 'flex', flexDirection: 'column', gap: 2 })}>
                    {files.map((file) => {
                      const isDownloading = downloadingFiles.has(file.file_id);
                      return (
                        <div
                          key={file.file_id}
                          className={css({
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid',
                            borderColor: 'gray.200',
                            borderRadius: 'md',
                            p: { base: 2, md: 3 },
                            bg: 'white',
                            cursor: isDownloading ? 'not-allowed' : 'pointer',
                            _hover: { bg: isDownloading ? 'white' : 'gray.50' }
                          })}
                          onClick={async () => {
                            if (isDownloading) return;
                            setDownloadingFiles(prev => new Set(prev).add(file.file_id));
                            try {
                              await downloadFile(file.file_path, `学習資料_${file.file_id}`);
                            } finally {
                              setDownloadingFiles(prev => {
                                const next = new Set(prev);
                                next.delete(file.file_id);
                                return next;
                              });
                            }
                          }}
                        >
                          <FileText className={css({
                            mr: 2,
                            color: 'gray.500',
                            fontSize: { base: '16px', md: '18px' }
                          })} />
                          <div className={css({ flex: 1 })}>
                            <div className={css({
                              fontSize: { base: 'xs', md: 'sm' },
                              fontWeight: 'medium'
                            })}>
                              {file.file_name || '学習資料をダウンロード'}
                            </div>
                          </div>
                          <div
                            className={css({
                              p: 1,
                              borderRadius: 'full',
                              opacity: isDownloading ? 0.5 : 1,
                            })}
                          >
                            {isDownloading ? (
                              <Loader2 size={16} className={css({ animation: 'spin 1s linear infinite' })} />
                            ) : (
                              <Download size={16} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};