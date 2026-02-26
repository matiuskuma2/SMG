import { Button } from '@/components/ui/button';
import type { MstTheme } from '@/lib/supabase/types';
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

interface ThemeListTableProps {
  themes: MstTheme[];
  handleEdit: (themeId: string) => void;
  handleDelete: (themeId: string) => void;
}

export const ThemeListTable: React.FC<ThemeListTableProps> = ({
  themes,
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
            <th className={headerStyle}>テーマ名</th>
            <th className={headerStyle}>説明</th>
            <th className={headerStyle}>アクション</th>
          </tr>
        </thead>
        <tbody>
          {themes.map((theme) => (
            <tr
              key={theme.theme_id}
              className={css({
                borderBottom: '1px solid',
                borderColor: 'gray.200',
                _hover: { bg: 'gray.100' },
                transition: 'background-color 0.2s',
                cursor: 'pointer',
              })}
              onClick={() => handleEdit(theme.theme_id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleEdit(theme.theme_id);
                }
              }}
            >
              <td className={cellStyle}>
                {theme.created_at
                  ? new Date(theme.created_at).toLocaleDateString('ja-JP')
                  : '-'}
              </td>
              <td className={ellipsisText}>{theme.theme_name}</td>
              <td className={ellipsisText}>{theme.description || '-'}</td>
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
                    onClick={() => handleEdit(theme.theme_id)}
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
                      handleDelete(theme.theme_id);
                    }}
                  >
                    <FaTrash size={14} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
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
