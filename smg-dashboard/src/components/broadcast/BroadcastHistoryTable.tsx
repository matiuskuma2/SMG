import { ActionButtons } from '@/components/ui/ActionIconButton';
import { css } from '@/styled-system/css';
import type { BroadcastHistoryWithTargets } from '@/types/broadcast';
import { formatIsoDate } from '@/utils/date';
import Link from 'next/link';
import type React from 'react';
import { FaEye } from 'react-icons/fa';

type BroadcastHistoryTableProps = {
  broadcasts: BroadcastHistoryWithTargets[];
  onDelete: (broadcastId: string) => void;
};

export const BroadcastHistoryTable: React.FC<BroadcastHistoryTableProps> = ({
  broadcasts,
  onDelete,
}) => {
  return (
    <div
      className={css({
        display: { base: 'none', xl: 'block' },
        overflowX: 'auto',
      })}
    >
      <table
        className={css({
          w: 'full',
          borderCollapse: 'collapse',
        })}
      >
        <thead>
          <tr
            className={css({
              bg: 'gray.50',
              borderBottom: '1px solid',
              borderColor: 'gray.200',
            })}
          >
            <th
              className={css({
                p: '3',
                textAlign: 'left',
                fontSize: 'sm',
                fontWeight: 'medium',
                color: 'gray.700',
                w: '120px',
              })}
            >
              送信日時
            </th>
            <th
              className={css({
                p: '3',
                textAlign: 'left',
                fontSize: 'sm',
                fontWeight: 'medium',
                color: 'gray.700',
              })}
            >
              メッセージ内容
            </th>
            <th
              className={css({
                p: '3',
                textAlign: 'center',
                fontSize: 'sm',
                fontWeight: 'medium',
                color: 'gray.700',
                w: '100px',
              })}
            >
              送信先人数
            </th>
            <th
              className={css({
                p: '3',
                textAlign: 'center',
                fontSize: 'sm',
                fontWeight: 'medium',
                color: 'gray.700',
                w: '80px',
              })}
            >
              状態
            </th>
            <th
              className={css({
                p: '3',
                textAlign: 'center',
                fontSize: 'sm',
                fontWeight: 'medium',
                color: 'gray.700',
                w: '180px',
                minW: '180px',
              })}
            >
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          {broadcasts.map((broadcast) => (
            <tr
              key={broadcast.broadcast_id}
              className={css({
                borderBottom: '1px solid',
                borderColor: 'gray.200',
                _hover: { bg: 'gray.50' },
              })}
            >
              <td
                className={css({
                  p: '3',
                  fontSize: 'sm',
                  color: 'gray.600',
                })}
              >
                {formatIsoDate(broadcast.created_at)}
              </td>
              <td
                className={css({
                  p: '3',
                  fontSize: 'sm',
                  color: 'gray.900',
                })}
              >
                <div
                  className={css({
                    maxW: '500px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  })}
                >
                  {broadcast.content}
                </div>
              </td>
              <td
                className={css({
                  p: '3',
                  fontSize: 'sm',
                  color: 'gray.900',
                  textAlign: 'center',
                })}
              >
                {broadcast.target_count}名
              </td>
              <td
                className={css({
                  p: '3',
                  textAlign: 'center',
                })}
              >
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
              </td>
              <td
                className={css({
                  p: '3',
                  textAlign: 'center',
                })}
              >
                <div
                  className={css({
                    display: 'flex',
                    gap: '2',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexWrap: 'nowrap',
                  })}
                >
                  <Link
                    href={`/broadcast-history/${broadcast.broadcast_id}`}
                    className={css({
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '1',
                      px: '3',
                      py: '1.5',
                      rounded: 'md',
                      bg: 'blue.600',
                      color: 'white',
                      fontSize: 'sm',
                      whiteSpace: 'nowrap',
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
                      px: '3',
                      py: '1.5',
                      rounded: 'md',
                      bg: 'red.600',
                      color: 'white',
                      fontSize: 'sm',
                      whiteSpace: 'nowrap',
                      _hover: { bg: 'red.700' },
                      cursor: 'pointer',
                    })}
                  >
                    削除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
