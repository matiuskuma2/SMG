'use client';

import { css } from '@/styled-system/css';
import dayjs from 'dayjs';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

type BroadcastDetailContentProps = {
  detail: {
    broadcast_id: string;
    is_sent: boolean;
    content: string;
    created_at: string;
    target_users: {
      user_id: string;
      username: string;
      email: string;
      company_name: string | null;
      is_sent: boolean;
    }[];
    success_count: number;
    failure_count: number;
  };
};

export function BroadcastDetailContent({
  detail,
}: BroadcastDetailContentProps) {
  const totalCount = detail.target_users.length;
  const successRate =
    totalCount > 0 ? ((detail.success_count / totalCount) * 100).toFixed(1) : 0;

  return (
    <div>
      {/* 配信情報 */}
      <div
        className={css({
          mb: '6',
          p: '6',
          rounded: 'lg',
          border: '1px solid',
          borderColor: 'gray.200',
          bg: 'white',
        })}
      >
        <h2
          className={css({
            fontSize: 'lg',
            fontWeight: 'bold',
            color: 'gray.800',
            mb: '4',
            pb: '3',
            borderBottom: '1px solid',
            borderColor: 'gray.200',
          })}
        >
          配信情報
        </h2>
        <div className={css({ display: 'flex', flexDir: 'column', gap: '3' })}>
          <div>
            <div
              className={css({ fontSize: 'sm', color: 'gray.600', mb: '1' })}
            >
              配信日時
            </div>
            <div className={css({ fontWeight: 'medium' })}>
              {dayjs(detail.created_at).format('YYYY年MM月DD日 HH:mm')}
            </div>
          </div>
          <div>
            <div
              className={css({ fontSize: 'sm', color: 'gray.600', mb: '1' })}
            >
              メッセージ内容
            </div>
            <div
              className={css({
                p: '4',
                rounded: 'md',
                bg: 'gray.50',
                border: '1px solid',
                borderColor: 'gray.200',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              })}
            >
              {detail.content}
            </div>
          </div>
        </div>
      </div>

      {/* 送信統計 */}
      <div
        className={css({
          mb: '6',
          p: '6',
          rounded: 'lg',
          border: '1px solid',
          borderColor: 'gray.200',
          bg: 'white',
        })}
      >
        <h2
          className={css({
            fontSize: 'lg',
            fontWeight: 'bold',
            color: 'gray.800',
            mb: '4',
            pb: '3',
            borderBottom: '1px solid',
            borderColor: 'gray.200',
          })}
        >
          送信統計
        </h2>
        <div
          className={css({
            display: 'grid',
            gridTemplateColumns: {
              base: '1fr',
              md: 'repeat(4, 1fr)',
            },
            gap: '4',
          })}
        >
          <div
            className={css({
              p: '4',
              rounded: 'md',
              bg: 'blue.50',
              border: '1px solid',
              borderColor: 'blue.200',
            })}
          >
            <div
              className={css({ fontSize: 'sm', color: 'blue.700', mb: '1' })}
            >
              総送信数
            </div>
            <div
              className={css({
                fontSize: '2xl',
                fontWeight: 'bold',
                color: 'blue.600',
              })}
            >
              {totalCount}
            </div>
          </div>
          <div
            className={css({
              p: '4',
              rounded: 'md',
              bg: 'green.50',
              border: '1px solid',
              borderColor: 'green.200',
            })}
          >
            <div
              className={css({ fontSize: 'sm', color: 'green.700', mb: '1' })}
            >
              送信成功
            </div>
            <div
              className={css({
                fontSize: '2xl',
                fontWeight: 'bold',
                color: 'green.600',
              })}
            >
              {detail.success_count}
            </div>
          </div>
          <div
            className={css({
              p: '4',
              rounded: 'md',
              bg: 'red.50',
              border: '1px solid',
              borderColor: 'red.200',
            })}
          >
            <div className={css({ fontSize: 'sm', color: 'red.700', mb: '1' })}>
              送信失敗
            </div>
            <div
              className={css({
                fontSize: '2xl',
                fontWeight: 'bold',
                color: 'red.600',
              })}
            >
              {detail.failure_count}
            </div>
          </div>
          <div
            className={css({
              p: '4',
              rounded: 'md',
              bg: 'purple.50',
              border: '1px solid',
              borderColor: 'purple.200',
            })}
          >
            <div
              className={css({ fontSize: 'sm', color: 'purple.700', mb: '1' })}
            >
              成功率
            </div>
            <div
              className={css({
                fontSize: '2xl',
                fontWeight: 'bold',
                color: 'purple.600',
              })}
            >
              {successRate}%
            </div>
          </div>
        </div>
      </div>

      {/* ユーザー別送信結果 */}
      <div
        className={css({
          p: '6',
          rounded: 'lg',
          border: '1px solid',
          borderColor: 'gray.200',
          bg: 'white',
        })}
      >
        <h2
          className={css({
            fontSize: 'lg',
            fontWeight: 'bold',
            color: 'gray.800',
            mb: '4',
            pb: '3',
            borderBottom: '1px solid',
            borderColor: 'gray.200',
          })}
        >
          ユーザー別送信結果
        </h2>

        {/* デスクトップ表示 */}
        <div
          className={css({
            display: { base: 'none', md: 'block' },
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
                  borderBottom: '2px solid',
                  borderColor: 'gray.200',
                })}
              >
                <th
                  className={css({
                    p: '3',
                    textAlign: 'left',
                    fontSize: 'sm',
                    fontWeight: 'semibold',
                    color: 'gray.700',
                  })}
                >
                  ステータス
                </th>
                <th
                  className={css({
                    p: '3',
                    textAlign: 'left',
                    fontSize: 'sm',
                    fontWeight: 'semibold',
                    color: 'gray.700',
                  })}
                >
                  ユーザー名
                </th>
                <th
                  className={css({
                    p: '3',
                    textAlign: 'left',
                    fontSize: 'sm',
                    fontWeight: 'semibold',
                    color: 'gray.700',
                  })}
                >
                  メールアドレス
                </th>
                <th
                  className={css({
                    p: '3',
                    textAlign: 'left',
                    fontSize: 'sm',
                    fontWeight: 'semibold',
                    color: 'gray.700',
                  })}
                >
                  会社名
                </th>
              </tr>
            </thead>
            <tbody>
              {detail.target_users.map((user) => (
                <tr
                  key={user.user_id}
                  className={css({
                    borderBottom: '1px solid',
                    borderColor: 'gray.200',
                    _hover: { bg: 'gray.50' },
                  })}
                >
                  <td className={css({ p: '3' })}>
                    {user.is_sent ? (
                      <div
                        className={css({
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2',
                          px: '3',
                          py: '1',
                          rounded: 'full',
                          bg: 'green.100',
                          color: 'green.700',
                          fontSize: 'sm',
                          fontWeight: 'medium',
                        })}
                      >
                        <FaCheckCircle />
                        送信済
                      </div>
                    ) : (
                      <div
                        className={css({
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2',
                          px: '3',
                          py: '1',
                          rounded: 'full',
                          bg: 'red.100',
                          color: 'red.700',
                          fontSize: 'sm',
                          fontWeight: 'medium',
                        })}
                      >
                        <FaTimesCircle />
                        未送信
                      </div>
                    )}
                  </td>
                  <td className={css({ p: '3', fontWeight: 'medium' })}>
                    {user.username}
                  </td>
                  <td className={css({ p: '3', color: 'gray.600' })}>
                    {user.email}
                  </td>
                  <td className={css({ p: '3', color: 'gray.600' })}>
                    {user.company_name || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* モバイル表示 */}
        <div
          className={css({
            display: { base: 'block', md: 'none' },
          })}
        >
          <div
            className={css({ display: 'flex', flexDir: 'column', gap: '3' })}
          >
            {detail.target_users.map((user) => (
              <div
                key={user.user_id}
                className={css({
                  p: '4',
                  rounded: 'md',
                  border: '1px solid',
                  borderColor: 'gray.200',
                  bg: user.is_sent ? 'white' : 'red.50',
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
                  <div className={css({ fontWeight: 'bold' })}>
                    {user.username}
                  </div>
                  {user.is_sent ? (
                    <div
                      className={css({
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2',
                        px: '3',
                        py: '1',
                        rounded: 'full',
                        bg: 'green.100',
                        color: 'green.700',
                        fontSize: 'xs',
                        fontWeight: 'medium',
                      })}
                    >
                      <FaCheckCircle />
                      送信済
                    </div>
                  ) : (
                    <div
                      className={css({
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2',
                        px: '3',
                        py: '1',
                        rounded: 'full',
                        bg: 'red.100',
                        color: 'red.700',
                        fontSize: 'xs',
                        fontWeight: 'medium',
                      })}
                    >
                      <FaTimesCircle />
                      未送信
                    </div>
                  )}
                </div>
                <div
                  className={css({
                    fontSize: 'sm',
                    color: 'gray.600',
                    mb: '1',
                  })}
                >
                  {user.email}
                </div>
                {user.company_name && (
                  <div
                    className={css({
                      fontSize: 'sm',
                      color: 'gray.600',
                      mb: '1',
                    })}
                  >
                    {user.company_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
