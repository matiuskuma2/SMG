import type { DmMessage } from '@/features/direct-message/hooks/use-messages';
import { css } from '@/styled-system/css';
import { Flex } from '@/styled-system/jsx';
import { token } from '@/styled-system/tokens';
import dayjs from 'dayjs';

type MessageItemProps = {
  isMe?: boolean;
  msg: DmMessage;
};

export const MessageItem = ({ msg }: MessageItemProps) => (
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
                className={css({
                  maxH: '200px',
                  objectFit: 'contain',
                  borderRadius: 'sm',
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
);
