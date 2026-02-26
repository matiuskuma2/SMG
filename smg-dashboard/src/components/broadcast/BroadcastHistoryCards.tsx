import { css } from '@/styled-system/css';
import type { BroadcastHistoryWithTargets } from '@/types/broadcast';
import { formatIsoDate } from '@/utils/date';
import Link from 'next/link';
import type React from 'react';
import { FaEye } from 'react-icons/fa';

type BroadcastHistoryCardsProps = {
  broadcasts: BroadcastHistoryWithTargets[];
  onDelete: (broadcastId: string) => void;
};

export const BroadcastHistoryCards: React.FC<BroadcastHistoryCardsProps> = ({
  broadcasts,
  onDelete,
}) => {
  return (
    <div
      className={css({
        display: { base: 'block', xl: 'none' },
        p: '4',
      })}
    >
      {broadcasts.map((broadcast) => (
        <div
          key={broadcast.broadcast_id}
          className={css({
            bg: 'white',
            rounded: 'lg',
            shadow: 'sm',
            p: '4',
            mb: '4',
            border: '1px solid',
            borderColor: 'gray.200',
          })}
        >
          <div
            className={css({
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              mb: '3',
            })}
          >
            <div>
              <div
                className={css({
                  fontSize: 'xs',
                  color: 'gray.600',
                  mb: '1',
                })}
              >
                {formatIsoDate(broadcast.created_at)}
              </div>
              {broadcast.is_sent ? (
                <span
                  className={css({
                    px: '2',
                    py: '1',
                    rounded: 'full',
                    bg: 'green.100',
                    color: 'green.800',
                    fontSize: 'xs',
                    fontWeight: 'medium',
                  })}
                >
                  送信済
                </span>
              ) : (
                <span
                  className={css({
                    px: '2',
                    py: '1',
                    rounded: 'full',
                    bg: 'gray.100',
                    color: 'gray.800',
                    fontSize: 'xs',
                    fontWeight: 'medium',
                  })}
                >
                  未送信
                </span>
              )}
            </div>
            <div
              className={css({
                fontSize: 'sm',
                fontWeight: 'medium',
                color: 'blue.600',
              })}
            >
              {broadcast.target_count}名
            </div>
          </div>

          <div
            className={css({
              fontSize: 'sm',
              color: 'gray.900',
              mb: '3',
              lineHeight: '1.5',
            })}
          >
            {broadcast.content.length > 100
              ? `${broadcast.content.substring(0, 100)}...`
              : broadcast.content}
          </div>

          <div
            className={css({
              display: 'flex',
              gap: '2',
              justifyContent: 'flex-end',
            })}
          >
            <Link
              href={`/broadcast-history/${broadcast.broadcast_id}`}
              className={css({
                display: 'inline-flex',
                alignItems: 'center',
                gap: '1',
                px: '4',
                py: '2',
                rounded: 'md',
                bg: 'blue.600',
                color: 'white',
                fontSize: 'sm',
                _hover: { bg: 'blue.700' },
                cursor: 'pointer',
              })}
            >
              <FaEye />
              詳細
            </Link>
            <button
              type="button"
              onClick={() => onDelete(broadcast.broadcast_id)}
              className={css({
                px: '4',
                py: '2',
                rounded: 'md',
                bg: 'red.600',
                color: 'white',
                fontSize: 'sm',
                _hover: { bg: 'red.700' },
                cursor: 'pointer',
              })}
            >
              削除
            </button>
          </div>
        </div>
      ))}

      {broadcasts.length === 0 && (
        <div
          className={css({
            p: '8',
            textAlign: 'center',
            color: 'gray.500',
          })}
        >
          配信履歴がありません
        </div>
      )}
    </div>
  );
};
