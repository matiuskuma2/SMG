import { Button } from '@/components/ui/button';
import type { ForBeginners } from '@/lib/api/forBeginners';
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

interface ForBeginnersListTableProps {
  notices: ForBeginners[];
  handleEdit: (noticeId: string) => void;
  handleDelete: (noticeId: string) => void;
}

export const ForBeginnersListTable: React.FC<ForBeginnersListTableProps> = ({
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
            <th className={headerStyle}>タイトル</th>
            <th className={headerStyle}>説明</th>
            <th className={cx(headerStyle, css({ textAlign: 'center' }))}>
              ステータス
            </th>
            <th className={headerStyle}>アクション</th>
          </tr>
        </thead>
        <tbody>
          {notices.map((notice) => {
            return (
              <tr
                key={notice.guide_item_id}
                className={cx(
                  css({
                    borderBottom: '1px solid',
                    borderColor: 'gray.200',
                    transition: 'background-color 0.2s',
                  }),
                )}
                onClick={() => handleEdit(notice.guide_item_id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleEdit(notice.guide_item_id);
                  }
                }}
              >
                <td className={ellipsisText}>{notice.title}</td>
                <td className={ellipsisText}>{notice.description || ''}</td>
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
                          _hover: { bg: 'red.700' },
                        }),
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notice.guide_item_id);
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
