import { ActionButtons } from '@/components/ui/ActionIconButton';
import { css } from '@/styled-system/css';
import type { Faq } from '@/types/faq';
import { formatIsoDate } from '@/utils/date';
import type React from 'react';

interface FaqListCardsProps {
  faqs: Faq[];
  handleEdit: (faqId: string) => void;
  handleDelete: (faqId: string) => void;
}

export const FaqListCards: React.FC<FaqListCardsProps> = ({
  faqs,
  handleEdit,
  handleDelete,
}) => {
  return (
    <div
      className={css({
        display: { base: 'block', xl: 'none' },
      })}
    >
      {faqs.map((faq) => (
        <div
          key={faq.faq_id}
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
            <h3
              className={css({
                fontSize: 'lg',
                fontWeight: 'bold',
                color: 'gray.900',
              })}
            >
              {faq.title}
            </h3>
            <ActionButtons
              targetId={faq.faq_id}
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
                説明:
              </span>
              <span className={css({ color: 'gray.600' })}>
                {faq.description || '未設定'}
              </span>
            </div>
            <div className={css({ display: 'flex', gap: '2' })}>
              <span
                className={css({ fontWeight: 'semibold', color: 'gray.700' })}
              >
                表示順:
              </span>
              <span className={css({ color: 'gray.600' })}>
                {faq.display_order}
              </span>
            </div>
            <div className={css({ display: 'flex', gap: '2' })}>
              <span
                className={css({ fontWeight: 'semibold', color: 'gray.700' })}
              >
                作成日:
              </span>
              <span className={css({ color: 'gray.600' })}>
                {formatIsoDate(faq.created_at)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
