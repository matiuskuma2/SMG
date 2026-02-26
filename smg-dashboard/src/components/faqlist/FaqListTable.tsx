import { ActionButtons } from '@/components/ui/ActionIconButton';
import { css } from '@/styled-system/css';
import type { Faq } from '@/types/faq';
import { formatIsoDate } from '@/utils/date';
import type React from 'react';

interface FaqListTableProps {
  faqs: Faq[];
  handleEdit: (faqId: string) => void;
  handleDelete: (faqId: string) => void;
}

export const FaqListTable: React.FC<FaqListTableProps> = ({
  faqs,
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
                minW: '80px',
              })}
            >
              表示順
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                minW: '200px',
              })}
            >
              質問
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                minW: '300px',
              })}
            >
              回答
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
          {faqs.map((faq) => (
            <tr
              key={faq.faq_id}
              className={css({
                borderBottom: '1px solid',
                borderColor: 'gray.200',
                _hover: { bg: 'gray.50' },
              })}
            >
              <td className={css({ py: '3', px: '4', textAlign: 'center' })}>
                {faq.display_order}
              </td>
              <td className={css({ py: '3', px: '4' })}>
                <div
                  className={css({ fontWeight: 'medium', color: 'gray.900' })}
                >
                  {faq.title}
                </div>
              </td>
              <td className={css({ py: '3', px: '4', color: 'gray.600' })}>
                {faq.description || '未設定'}
              </td>
              <td className={css({ py: '3', px: '4', color: 'gray.600' })}>
                {formatIsoDate(faq.created_at)}
              </td>
              <td className={css({ py: '3', px: '4' })}>
                <ActionButtons
                  targetId={faq.faq_id}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {faqs.length === 0 && (
        <div
          className={css({
            textAlign: 'center',
            py: '8',
            color: 'gray.500',
          })}
        >
          FAQが見つかりませんでした
        </div>
      )}
    </div>
  );
};
