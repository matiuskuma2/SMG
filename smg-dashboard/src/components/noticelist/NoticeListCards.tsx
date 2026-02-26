import type { Notice } from '@/components/notice/types';
import { Button } from '@/components/ui/button';
import { css, cx } from '@/styled-system/css';
import type React from 'react';
import { FaPen, FaTrash } from 'react-icons/fa6';

interface NoticeListCardsProps {
  notices: Notice[];
  handleEdit: (noticeId: string) => void;
  handleDelete: (noticeId: string) => void;
}

export const NoticeListCards: React.FC<NoticeListCardsProps> = ({
  notices,
  handleEdit,
  handleDelete,
}) => {
  return (
    <div
      className={css({
        display: { base: 'block', xl: 'none' },
      })}
    >
      {notices.map((notice) => (
        <div
          key={notice.notice_id}
          className={css({
            borderBottom: '1px solid',
            borderColor: 'gray.200',
            p: '4',
          })}
        >
          <div
            className={css({
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: '3',
            })}
          >
            <div className={css({ flex: 1 })}>
              <div
                className={css({
                  fontWeight: 'bold',
                  mb: 1,
                  color: 'gray.600',
                  fontSize: 'sm',
                  display: '-webkit-box',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                })}
                style={{
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {notice.title}
              </div>
              <div
                className={css({
                  color: 'gray.600',
                  fontSize: 'sm',
                  mb: 2,
                  display: '-webkit-box',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                })}
                style={{
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {notice.content}
              </div>
            </div>
          </div>

          <div className={css({})}>
            <div
              className={css({
                display: 'grid',
                gridTemplateColumns: '100px 1fr',
                gap: '1',
                mb: '1',
              })}
            >
              <div className={css({ color: 'gray.600', fontSize: 'sm' })}>
                投稿日:
              </div>
              <div className={css({ fontSize: 'sm' })}>
                {notice.created_at
                  ? new Date(notice.created_at).toLocaleDateString('ja-JP')
                  : '-'}
              </div>
            </div>
            <div
              className={css({
                display: 'grid',
                gridTemplateColumns: '100px 1fr',
                gap: '1',
                mb: '1',
              })}
            >
              <div className={css({ color: 'gray.600', fontSize: 'sm' })}>
                カテゴリー:
              </div>
              <div className={css({ fontSize: 'sm' })}>
                {notice.category?.category_name || '-'}
              </div>
            </div>
            <div
              className={css({
                display: 'grid',
                gridTemplateColumns: '100px 1fr',
                gap: '1',
                mb: '1',
              })}
            >
              <div className={css({ color: 'gray.600', fontSize: 'sm' })}>
                ステータス:
              </div>
              <div className={css({ fontSize: 'sm' })}>
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
              </div>
            </div>
            <div
              className={css({
                display: 'grid',
                gridTemplateColumns: '100px 1fr',
                gap: '1',
                mb: '1',
              })}
            >
              <div className={css({ color: 'gray.600', fontSize: 'sm' })}>
                掲載期間:
              </div>
              <div className={css({ fontSize: 'sm' })}>
                {notice.publish_start_at && notice.publish_end_at
                  ? `${new Date(notice.publish_start_at).toLocaleDateString('ja-JP')} - ${new Date(notice.publish_end_at).toLocaleDateString('ja-JP')}`
                  : '-'}
              </div>
            </div>
          </div>
          <div
            className={css({
              display: 'flex',
              gap: '2',
              mt: '3',
              justifyContent: 'flex-end',
            })}
          >
            <Button
              size="sm"
              variant="outline"
              aria-label="編集する"
              className={cx(
                iconButtonStyle,
                css({
                  bg: 'blue.400',
                  borderColor: 'blue.600',
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
                }),
              )}
              onClick={() => handleDelete(notice.notice_id)}
            >
              <FaTrash size={14} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

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
