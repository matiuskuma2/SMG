import { ActionButtons } from '@/components/ui/ActionIconButton';
import { css } from '@/styled-system/css';
import type { Radio } from '@/types/radio';
import { formatIsoDate } from '@/utils/date';
import type React from 'react';

interface RadioListCardsProps {
  radios: Radio[];
  handleEdit: (radioId: string) => void;
  handleDelete: (radioId: string) => void;
}

export const RadioListCards: React.FC<RadioListCardsProps> = ({
  radios,
  handleEdit,
  handleDelete,
}) => {
  return (
    <div
      className={css({
        display: { base: 'block', xl: 'none' },
      })}
    >
      {radios.map((radio) => (
        <div
          key={radio.radio_id}
          className={css({
            bg: 'white',
            border: '1px solid',
            borderColor: 'gray.200',
            borderRadius: 'lg',
            p: '4',
            mb: '4',
            _hover: { boxShadow: 'md' },
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
              <h3
                className={css({
                  fontSize: 'lg',
                  fontWeight: 'bold',
                  color: 'gray.900',
                  mb: '2',
                })}
              >
                {radio.radio_name}
              </h3>
              {radio.is_draft ? (
                <span
                  className={css({
                    px: '2',
                    py: '1',
                    bg: 'gray.200',
                    color: 'gray.700',
                    borderRadius: 'md',
                    fontSize: 'sm',
                    fontWeight: 'medium',
                  })}
                >
                  下書き
                </span>
              ) : (
                <span
                  className={css({
                    px: '2',
                    py: '1',
                    bg: 'green.100',
                    color: 'green.700',
                    borderRadius: 'md',
                    fontSize: 'sm',
                    fontWeight: 'medium',
                  })}
                >
                  公開
                </span>
              )}
            </div>
            <ActionButtons
              targetId={radio.radio_id}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
            />
          </div>
          <div
            className={css({
              display: 'flex',
              flexDirection: 'column',
              gap: '2',
            })}
          >
            <div className={css({ display: 'flex', gap: '2' })}>
              <span
                className={css({ fontWeight: 'semibold', color: 'gray.700' })}
              >
                投稿開始:
              </span>
              <span className={css({ color: 'gray.600' })}>
                {radio.publish_start_at
                  ? formatIsoDate(radio.publish_start_at)
                  : '未設定'}
              </span>
            </div>
            <div className={css({ display: 'flex', gap: '2' })}>
              <span
                className={css({ fontWeight: 'semibold', color: 'gray.700' })}
              >
                投稿終了:
              </span>
              <span className={css({ color: 'gray.600' })}>
                {radio.publish_end_at
                  ? formatIsoDate(radio.publish_end_at)
                  : '未設定'}
              </span>
            </div>
            <div className={css({ display: 'flex', gap: '2' })}>
              <span
                className={css({ fontWeight: 'semibold', color: 'gray.700' })}
              >
                作成日:
              </span>
              <span className={css({ color: 'gray.600' })}>
                {formatIsoDate(radio.created_at)}
              </span>
            </div>
          </div>
        </div>
      ))}
      {radios.length === 0 && (
        <div
          className={css({
            textAlign: 'center',
            py: '8',
            color: 'gray.500',
          })}
        >
          ラジオが見つかりませんでした
        </div>
      )}
    </div>
  );
};
