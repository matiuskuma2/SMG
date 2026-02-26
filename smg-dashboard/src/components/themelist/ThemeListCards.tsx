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

interface ThemeListCardsProps {
  themes: MstTheme[];
  handleEdit: (themeId: string) => void;
  handleDelete: (themeId: string) => void;
}

export const ThemeListCards: React.FC<ThemeListCardsProps> = ({
  themes,
  handleEdit,
  handleDelete,
}) => {
  return (
    <div
      className={css({
        display: { base: 'block', xl: 'none' },
        p: '4',
      })}
    >
      <div
        className={css({ display: 'flex', flexDirection: 'column', gap: '3' })}
      >
        {themes.map((theme) => (
          <div
            key={theme.theme_id}
            className={css({
              bg: 'white',
              border: '1px solid',
              borderColor: 'gray.200',
              rounded: 'lg',
              p: '4',
              shadow: 'sm',
              _hover: { shadow: 'md', borderColor: 'gray.300' },
              transition: 'all 0.2s',
              cursor: 'pointer',
            })}
            onClick={() => handleEdit(theme.theme_id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleEdit(theme.theme_id);
              }
            }}
          >
            <div className={css({ mb: '3' })}>
              <h3
                className={css({ fontWeight: 'bold', fontSize: 'lg', mb: '2' })}
              >
                {theme.theme_name}
              </h3>
              <p
                className={css({ fontSize: 'sm', color: 'gray.600', mb: '2' })}
              >
                {theme.description || '-'}
              </p>
              <p className={css({ fontSize: 'xs', color: 'gray.500' })}>
                作成日:{' '}
                {theme.created_at
                  ? new Date(theme.created_at).toLocaleDateString('ja-JP')
                  : '-'}
              </p>
            </div>
            <div
              className={css({
                display: 'flex',
                gap: '2',
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
                    _hover: { bg: 'blue.700' },
                  }),
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(theme.theme_id);
                }}
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
          </div>
        ))}
      </div>
    </div>
  );
};
