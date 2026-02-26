import { Button } from '@/components/ui/button';
import type { ForBeginners } from '@/lib/api/forBeginners';
import { css, cx } from '@/styled-system/css';
import type React from 'react';
import { FaPen, FaTrash } from 'react-icons/fa6';

interface ForBeginnersListCardsProps {
  notices: ForBeginners[];
  handleEdit: (noticeId: string) => void;
  handleDelete: (noticeId: string) => void;
}

export const ForBeginnersListCards: React.FC<ForBeginnersListCardsProps> = ({
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
          key={notice.guide_item_id}
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
                {notice.description || ''}
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
              onClick={() => handleEdit(notice.guide_item_id)}
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
              onClick={() => handleDelete(notice.guide_item_id)}
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
