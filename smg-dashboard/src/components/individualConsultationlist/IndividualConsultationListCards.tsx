import { Button } from '@/components/ui/button';
import { css, cx } from '@/styled-system/css';
import type { IndividualConsultationType } from '@/types/individualConsultation';
import type React from 'react';
import { FaPen, FaTrash, FaUsers } from 'react-icons/fa6';

interface IndividualConsultationListCardsProps {
  individualConsultations: IndividualConsultationType[];
  handleViewParticipants: (individualConsultationId: string) => void;
  handleEdit: (individualConsultationId: string) => void;
  handleDelete: (individualConsultationId: string) => void;
}

export const IndividualConsultationListCards: React.FC<
  IndividualConsultationListCardsProps
> = ({
  individualConsultations,
  handleViewParticipants,
  handleEdit,
  handleDelete,
}) => {
  return (
    <div
      className={css({
        display: { base: 'block', xl: 'none' },
      })}
    >
      {individualConsultations.map((individualConsultation) => {
        const isExpired =
          new Date(individualConsultation.application_end_datetime) <
          new Date();
        return (
          <div
            key={individualConsultation.consultation_id}
            className={css({
              borderBottom: '1px solid',
              borderColor: 'gray.200',
              p: '4',
              bg: isExpired ? 'gray.100' : 'white',
              color: isExpired ? 'gray.500' : 'inherit',
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
                <div className={css({ fontWeight: 'bold', mb: 1 })}>
                  {individualConsultation.title}
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
                  講師名:
                </div>
                <div className={css({ fontSize: 'sm' })}>
                  {individualConsultation.instructorName}
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
                  申込期限:
                </div>
                <div className={css({ fontSize: 'sm' })}>
                  {individualConsultation.application_start_datetime} ~{' '}
                  {individualConsultation.application_end_datetime}
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
                  申込人数:
                </div>
                <div className={css({ fontSize: 'sm' })}>
                  {individualConsultation.applicants}人
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
                aria-label="参加者一覧"
                className={cx(
                  iconButtonStyle,
                  css({
                    bg: 'green.400',
                    borderColor: 'green.600',
                  }),
                )}
                onClick={() =>
                  handleViewParticipants(individualConsultation.consultation_id)
                }
              >
                <FaUsers size={24} />
              </Button>
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
                onClick={() =>
                  handleEdit(individualConsultation.consultation_id)
                }
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
                onClick={() =>
                  handleDelete(individualConsultation.consultation_id)
                }
              >
                <FaTrash size={14} />
              </Button>
            </div>
          </div>
        );
      })}
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
