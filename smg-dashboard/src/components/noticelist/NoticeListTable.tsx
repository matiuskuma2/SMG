import type { Notice } from '@/components/notice/types';
import { Button } from '@/components/ui/button';
import { css, cx } from '@/styled-system/css';
import type React from 'react';
import { FaPen, FaTrash } from 'react-icons/fa6';

const iconButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: '2',
  py: '2',
  borderRadius: 'md',
  cursor: 'pointer',
  width: '32px',
  height: '32px',
  color: 'white',
  _hover: { color: 'white' },
});

const ellipsisText = css({
  py: '3',
  px: '4',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxW: '400px',
});

interface NoticeListTableProps {
  notices: Notice[];
  handleEdit: (noticeId: string) => void;
  handleDelete: (noticeId: string) => void;
}

export const NoticeListTable: React.FC<NoticeListTableProps> = ({
  notices,
  handleEdit,
  handleDelete,
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
          textAlign: 'left',
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
            <th className={headerStyle}>作成日</th>
            <th className={headerStyle}>カテゴリー</th>
            <th className={headerStyle}>タイトル</th>
            <th className={headerStyle}>内容</th>
            <th className={headerStyle}>ステータス</th>
            <th className={headerStyle}>投稿期間</th>
            <th className={headerStyle}>アクション</th>
          </tr>
        </thead>
        <tbody>
          {notices.map((notice) => {
            const isExpired =
              notice.publish_end_at &&
              new Date(notice.publish_end_at) < new Date();

            return (
              <tr
                key={notice.notice_id}
                className={cx(
                  css({
                    borderBottom: '1px solid',
                    borderColor: 'gray.200',
                    _hover: { bg: isExpired ? undefined : 'gray.100' },
                    transition: 'background-color 0.2s',
                  }),
                  isExpired &&
                    css({
                      bg: 'gray.100',
                      color: 'gray.500',
                    }),
                )}
                onClick={() => handleEdit(notice.notice_id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleEdit(notice.notice_id);
                  }
                }}
              >
                <td className={cellStyle}>
                  {notice.created_at
                    ? new Date(notice.created_at).toLocaleDateString('ja-JP')
                    : '-'}
                </td>
                <td className={cellStyle}>
                  {notice.category?.category_name || '-'}
                </td>
                <td className={ellipsisText}>{notice.title}</td>
                <td className={ellipsisText}>{notice.content}</td>
                <td className={css({ py: '3', px: '4', textAlign: 'center' })}>
                  {notice.is_draft ? (
                    <span
                      className={css({
                        color: 'gray.500',
                        fontStyle: 'italic',
                        fontWeight: 'medium',
                      })}
                    >
                      下書き
                    </span>
                  ) : (
                    <span
                      className={css({
                        color: 'green.600',
                        fontWeight: 'medium',
                      })}
                    >
                      公開
                    </span>
                  )}
                </td>
                <td className={cellStyle}>
                  {notice.publish_start_at && notice.publish_end_at
                    ? `${new Date(notice.publish_start_at).toLocaleDateString('ja-JP')} - ${new Date(notice.publish_end_at).toLocaleDateString('ja-JP')}`
                    : '-'}
                </td>
                <td className={cellStyle}>
                  <div className={css({ display: 'flex', gap: '2' })}>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label="編集する"
                      className={cx(
                        iconButtonStyle,
                        css({
                          bg: 'blue.400',
                          borderColor: 'blue.600',
                          _hover: { bg: 'blue.700' },
                        }),
                      )}
                      onClick={() => handleEdit(notice.notice_id)}
                    >
                      <FaPen size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label="削除する"
                      className={cx(
                        iconButtonStyle,
                        css({
                          bg: 'red.400',
                          borderColor: 'red.600',
                          _hover: { bg: 'red.700' },
                        }),
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notice.notice_id);
                      }}
                    >
                      <FaTrash size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const headerStyle = css({
  py: '3',
  px: '4',
  fontWeight: 'semibold',
  color: 'gray.700',
  minW: '120px',
});

const cellStyle = css({ py: '3', px: '4' });
