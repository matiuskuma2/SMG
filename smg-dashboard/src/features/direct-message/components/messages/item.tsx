'use client';

import type { DmMessage } from '@/features/direct-message/hooks/use-messages';
import { css } from '@/styled-system/css';
import { Flex } from '@/styled-system/jsx';
import { token } from '@/styled-system/tokens';
import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import { LuDownload, LuX } from 'react-icons/lu';

type MessageItemProps = {
  isMe?: boolean;
  msg: DmMessage;
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

export const MessageItem = ({ msg }: MessageItemProps) => {
  const [modalImage, setModalImage] = useState<string | null>(null);

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
                {msg.images.map((d) => (
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
                  {msg.content}
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
