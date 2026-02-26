import { ActionButtons } from '@/components/ui/ActionIconButton';
import { css } from '@/styled-system/css';
import type { Radio } from '@/types/radio';
import { formatIsoDate } from '@/utils/date';
import type React from 'react';

interface RadioListTableProps {
  radios: Radio[];
  handleEdit: (radioId: string) => void;
  handleDelete: (radioId: string) => void;
}

export const RadioListTable: React.FC<RadioListTableProps> = ({
  radios,
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
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                minW: '200px',
              })}
            >
              ラジオ名
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                minW: '150px',
              })}
            >
              投稿開始
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                minW: '150px',
              })}
            >
              投稿終了
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                minW: '100px',
              })}
            >
              状態
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                minW: '120px',
              })}
            >
              作成日
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                minW: '150px',
              })}
            >
              アクション
            </th>
          </tr>
        </thead>
        <tbody>
          {radios.map((radio) => (
            <tr
              key={radio.radio_id}
              className={css({
                borderBottom: '1px solid',
                borderColor: 'gray.200',
                _hover: { bg: 'gray.50' },
              })}
            >
              <td className={css({ py: '3', px: '4' })}>
                <div
                  className={css({ fontWeight: 'medium', color: 'gray.900' })}
                >
                  {radio.radio_name}
                </div>
              </td>
              <td className={css({ py: '3', px: '4', color: 'gray.600' })}>
                {radio.publish_start_at
                  ? formatIsoDate(radio.publish_start_at)
                  : '未設定'}
              </td>
              <td className={css({ py: '3', px: '4', color: 'gray.600' })}>
                {radio.publish_end_at
                  ? formatIsoDate(radio.publish_end_at)
                  : '未設定'}
              </td>
              <td className={css({ py: '3', px: '4' })}>
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
              </td>
              <td className={css({ py: '3', px: '4', color: 'gray.600' })}>
                {formatIsoDate(radio.created_at)}
              </td>
              <td className={css({ py: '3', px: '4' })}>
                <ActionButtons
                  targetId={radio.radio_id}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
