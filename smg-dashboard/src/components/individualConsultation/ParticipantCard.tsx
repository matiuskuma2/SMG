import { Avatar } from '@/components/ui/Avatar';
import { css } from '@/styled-system/css';
import { hstack, vstack } from '@/styled-system/patterns';
import type { Participant } from '@/types/individualConsultation';
import Link from 'next/link';
import { useState } from 'react';

type ParticipantCardProps = {
  participant: Participant;
};

export const ParticipantCard = ({ participant }: ParticipantCardProps) => {
  const [selectedDateTime, setSelectedDateTime] = useState<string>('');
  return (
    <div
      className={css({
        p: '4',
        borderRadius: 'md',
        border: '1px solid #e2e8f0',
        mb: '3',
        bg: 'white',
        boxShadow: 'sm',
        textAlign: 'left',
      })}
    >
      <div className={hstack({ gap: '3', mb: '3' })}>
        <Link href={`/user/${participant.user_id}`}>
          <Avatar
            src={participant.icon || ''}
            alt={participant.username || ''}
            size="md"
          />
        </Link>
        <div>
          <div className={css({ fontWeight: 'bold' })}>
            {participant.username || ''}
          </div>
          <div className={css({ fontSize: 'sm', color: 'gray.600' })}>
            {participant.company_name || ''}
          </div>
        </div>
      </div>

      <div className={vstack({ gap: '2', alignItems: 'stretch' })}>
        <InfoRow label="メール" value={participant.email} maxWidth />
        <InfoRow label="電話" value={participant.phone_number || ''} />
        <InfoRow label="属性" value={participant.user_type || ''} />
        <InfoRow
          label="初回相談"
          value={participant.firstTime ? '初回' : '再訪'}
        />
        <div>
          <span className={css({ fontSize: 'xs', color: 'gray.600' })}>
            当選日時:
          </span>
          <select
            value={selectedDateTime}
            onChange={(e) => setSelectedDateTime(e.target.value)}
            className={css({
              mt: '1',
              px: '2',
              py: '1',
              fontSize: 'sm',
              border: '1px solid',
              borderColor: 'gray.300',
              borderRadius: 'md',
              bg: 'white',
              width: '100%',
            })}
          >
            <option value="">該当なし</option>
            {participant.candidateDateAndTime.map((date) => (
              <option
                key={date.schedule_datetime}
                value={date.schedule_datetime}
              >
                第{date.candidateRanking}希望：{date.schedule_datetime}
              </option>
            ))}
          </select>
        </div>
        {participant.remarks && (
          <div>
            <span className={css({ fontSize: 'xs', color: 'gray.600' })}>
              備考:
            </span>
            <p
              className={css({
                fontSize: 'sm',
                mt: 1,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              })}
            >
              {participant.remarks}
            </p>
          </div>
        )}
      </div>

      <Link href={`/user/${participant.user_id}`}>
        <button
          type="button"
          className={css({
            w: 'full',
            mt: '3',
            fontSize: 'sm',
            p: '2',
            textAlign: 'center',
            borderRadius: 'md',
            border: '1px solid #e2e8f0',
            bg: 'gray.50',
            _hover: { bg: 'gray.100' },
          })}
        >
          詳細を見る
        </button>
      </Link>
    </div>
  );
};

const InfoRow = ({
  label,
  value,
  maxWidth = false,
  multiline = false,
}: {
  label: string;
  value: string;
  maxWidth?: boolean;
  multiline?: boolean;
}) => (
  <div
    className={hstack({ justifyContent: 'space-between', alignItems: 'start' })}
  >
    <span className={css({ fontSize: 'xs', color: 'gray.600' })}>{label}:</span>
    <span
      className={css({
        fontSize: 'sm',
        fontWeight: 'medium',
        maxW: maxWidth ? '60%' : 'full',
        overflow: 'hidden',
        textOverflow: multiline ? 'initial' : 'ellipsis',
        display: multiline ? 'block' : 'inline-block',
        whiteSpace: multiline ? 'normal' : 'nowrap',
      })}
    >
      {value}
    </span>
  </div>
);
