'use client';

import type { DmMessage } from '@/features/direct-message/hooks/use-messages';
import { isImageFile } from '@/features/direct-message/lib/image';
import { css } from '@/styled-system/css';
import { Flex } from '@/styled-system/jsx';
import { token } from '@/styled-system/tokens';
import dayjs from 'dayjs';
import { useCallback, useMemo, useState } from 'react';
import { LuDownload, LuX, LuFile, LuFileText, LuFileSpreadsheet, LuPresentation } from 'react-icons/lu';

// URL正規表現パターン
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// テキスト中のURLをクリック可能なリンクに変換するコンポーネント
const LinkifiedText = ({ text, isMe }: { text: string; isMe: boolean }) => {
  const parts = useMemo(() => {
    const result: { type: 'text' | 'link'; value: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    const regex = new RegExp(URL_REGEX.source, 'g');

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result.push({ type: 'text', value: text.slice(lastIndex, match.index) });
      }
      let url = match[0];
      const trailingPunct = url.match(/[)\uff09\u3002\u3001,\uff0c]+$/);
      if (trailingPunct) {
        url = url.slice(0, -trailingPunct[0].length);
      }
      result.push({ type: 'link', value: url });
      lastIndex = match.index + url.length;
      regex.lastIndex = lastIndex;
    }
    if (lastIndex < text.length) {
      result.push({ type: 'text', value: text.slice(lastIndex) });
    }
    return result;
  }, [text]);

  return (
    <>
      {parts.map((part, i) =>
        part.type === 'link' ? (
          <a
            key={i}
            href={part.value}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: isMe ? '#c3e0ff' : '#90cdf4',
              textDecoration: 'underline',
              wordBreak: 'break-all',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {part.value}
          </a>
        ) : (
          <span key={i}>{part.value}</span>
        ),
      )}
    </>
  );
};

type MessageItemProps = {
  isMe?: boolean;
  msg: DmMessage;
};

const getFileIcon = (url: string) => {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return <LuFileText size={24} />;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <LuFileSpreadsheet size={24} />;
  if (['ppt', 'pptx'].includes(ext)) return <LuPresentation size={24} />;
  if (['doc', 'docx', 'txt'].includes(ext)) return <LuFileText size={24} />;
  return <LuFile size={24} />;
};

const getFileName = (url: string) => {
  const path = url.split('/').pop() || 'file';
  // UUIDプレフィックスを除去してファイル名を短縮表示
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const extLabel: Record<string, string> = {
    pdf: 'PDF',
    xls: 'Excel',
    xlsx: 'Excel',
    doc: 'Word',
    docx: 'Word',
    ppt: 'PowerPoint',
    pptx: 'PowerPoint',
    csv: 'CSV',
    txt: 'テキスト',
  };
  return extLabel[ext] ? `${extLabel[ext]}ファイル` : `ファイル (.${ext})`;
};

const ImageModal = ({
  src,
  onClose,
}: { src: string; onClose: () => void }) => {
  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = src.split('/').pop() || 'image.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, '_blank');
    }
  }, [src]);

  return (
    <div
      className={css({
        pos: 'fixed',
        inset: 0,
        bg: 'rgba(0,0,0,0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      })}
      onClick={onClose}
    >
      <div
        className={css({
          pos: 'absolute',
          top: '4',
          right: '4',
          display: 'flex',
          gap: '3',
        })}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          className={css({
            color: 'white',
            bg: 'rgba(255,255,255,0.2)',
            rounded: 'full',
            p: '2',
            cursor: 'pointer',
            _hover: { bg: 'rgba(255,255,255,0.4)' },
          })}
          title="ダウンロード"
        >
          <LuDownload size={24} />
        </button>
        <button
          type="button"
          onClick={onClose}
          className={css({
            color: 'white',
            bg: 'rgba(255,255,255,0.2)',
            rounded: 'full',
            p: '2',
            cursor: 'pointer',
            _hover: { bg: 'rgba(255,255,255,0.4)' },
          })}
          title="閉じる"
        >
          <LuX size={24} />
        </button>
      </div>
      <img
        src={src}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className={css({
          maxW: '90vw',
          maxH: '90vh',
          objectFit: 'contain',
          cursor: 'default',
        })}
      />
    </div>
  );
};

const FileAttachment = ({ url }: { url: string }) => {
  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = url.split('/').pop() || 'file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  }, [url]);

  return (
    <div
      onClick={handleDownload}
      className={css({
        display: 'flex',
        alignItems: 'center',
        gap: '2',
        p: '3',
        bg: 'gray.100',
        rounded: 'md',
        cursor: 'pointer',
        transition: 'background 0.2s',
        _hover: { bg: 'gray.200' },
        minW: '180px',
      })}
    >
      <div className={css({ color: 'gray.600', flexShrink: 0 })}>
        {getFileIcon(url)}
      </div>
      <div className={css({ flex: 1, minW: 0 })}>
        <div className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'gray.800', truncate: true })}>
          {getFileName(url)}
        </div>
      </div>
      <div className={css({ color: 'gray.500', flexShrink: 0 })}>
        <LuDownload size={16} />
      </div>
    </div>
  );
};

export const MessageItem = ({ msg }: MessageItemProps) => {
  const [modalImage, setModalImage] = useState<string | null>(null);

  const imageAttachments = msg.images.filter((d) => isImageFile(d.image_url));
  const fileAttachments = msg.images.filter((d) => !isImageFile(d.image_url));

  return (
    <>
      {modalImage && (
        <ImageModal src={modalImage} onClose={() => setModalImage(null)} />
      )}
      <div className={css({ py: '1' })}>
        <Flex
          alignItems={'end'}
          columnGap={'.5rem'}
          justifyContent={msg.isMe ? 'end' : 'start'}
          flexDir={msg.isMe ? 'row-reverse' : 'row'}
        >
          <Flex
            flexDir={'column'}
            alignItems={msg.isMe ? 'end' : 'start'}
            maxW={'50%'}
            position={'relative'}
          >
            {msg.is_inquiry && (
              <div
                className={css({
                  fontSize: 'xs',
                  px: '2',
                  py: '0.5',
                  bg: 'orange.500',
                  color: 'white',
                  rounded: 'md',
                  fontWeight: 'medium',
                  width: 'fit-content',
                  position: 'relative',
                  zIndex: 1,
                  mb: '-0.5rem',
                })}
                style={{
                  marginLeft: msg.isMe ? '0' : '0.5rem',
                  marginRight: msg.isMe ? '0.5rem' : '0',
                }}
              >
                お問い合わせ
              </div>
            )}
            {msg.images.length > 0 ? (
              <Flex flexDir={'column'} gap={'.5rem'} w={'full'}>
                {/* 画像ファイル */}
                {imageAttachments.map((d) => (
                  <img
                    key={d.image_id}
                    src={d.image_url}
                    alt=""
                    decoding="async"
                    onClick={() => setModalImage(d.image_url)}
                    className={css({
                      maxH: '200px',
                      objectFit: 'contain',
                      borderRadius: 'sm',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                      _hover: { opacity: 0.85 },
                    })}
                  />
                ))}
                {/* ファイル添付（PDF, Excel等） */}
                {fileAttachments.map((d) => (
                  <FileAttachment key={d.image_id} url={d.image_url} />
                ))}
                {/* テキストメッセージがある場合は表示 */}
                {msg.content && (
                  <div
                    className={css({
                      rounded: 'md',
                      color: 'white',
                      p: '2',
                    })}
                    style={{
                      background: msg.isMe ? '#007aff' : token('colors.gray.500'),
                      borderBottomRightRadius: msg.isMe ? '0' : '8px',
                      borderBottomLeftRadius: !msg.isMe ? '0' : '8px',
                    }}
                  >
                    <div
                      className={css({
                        fontSize: 'md',
                        textAlign: 'left',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      })}
                    >
                      <LinkifiedText text={msg.content ?? ''} isMe={msg.isMe} />
                    </div>
                  </div>
                )}
              </Flex>
            ) : (
              <div
                className={css({
                  rounded: 'md',
                  color: 'white',
                  p: '2',
                  minH: '40px',
                })}
                style={{
                  background: msg.isMe ? '#007aff' : token('colors.gray.500'),
                  borderBottomRightRadius: msg.isMe ? '0' : '8px',
                  borderBottomLeftRadius: !msg.isMe ? '0' : '8px',
                }}
              >
                <div
                  className={css({
                    fontSize: 'md',
                    textAlign: 'left',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  })}
                >
                  <LinkifiedText text={msg.content ?? ''} isMe={msg.isMe} />
                </div>
              </div>
            )}
          </Flex>

          <div
            className={css({
              fontSize: 'xs',
              textAlign: 'right',
              cursor: 'default',
            })}
          >
            <div>{dayjs(msg.created_at).format('HH:mm')}</div>
          </div>
        </Flex>
      </div>
    </>
  );
};
