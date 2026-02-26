import { Avatar } from '@/components/ui/Avatar';
import { css } from '@/styled-system/css';
import { hstack, vstack } from '@/styled-system/patterns';
import Link from 'next/link';
import { useState } from 'react';
import { ConsultationDetailModal } from './ConsultationDetailModal';
import { EventParticipantDetailDialog } from './EventParticipantDetailDialog';
import type { Participant } from './types';

type ParticipantCardProps = {
  participant: Participant;
  activeTab: 'event' | 'party' | 'consultation';
  eventId?: string;
};

export const ParticipantCard = ({
  participant,
  activeTab,
  eventId,
}: ParticipantCardProps) => {
  const [consultationModal, setConsultationModal] = useState<{
    isOpen: boolean;
    participant: Participant | null;
  }>({
    isOpen: false,
    participant: null,
  });

  const [participantDetailModal, setParticipantDetailModal] = useState<{
    isOpen: boolean;
    participant: Participant | null;
  }>({
    isOpen: false,
    participant: null,
  });

  const handleCardClick = () => {
    if (activeTab === 'consultation') {
      setConsultationModal({
        isOpen: true,
        participant: participant,
      });
    } else if (activeTab === 'event' || activeTab === 'party') {
      setParticipantDetailModal({
        isOpen: true,
        participant: participant,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <>
      <div
        className={css({
          p: '4',
          borderRadius: 'md',
          border: '1px solid #e2e8f0',
          mb: '3',
          bg: 'white',
          boxShadow: 'sm',
          cursor:
            activeTab === 'consultation' ||
            activeTab === 'event' ||
            activeTab === 'party'
              ? 'pointer'
              : 'default',
          _hover:
            activeTab === 'consultation' ||
            activeTab === 'event' ||
            activeTab === 'party'
              ? { bg: 'gray.50' }
              : {},
        })}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        tabIndex={
          activeTab === 'consultation' ||
          activeTab === 'event' ||
          activeTab === 'party'
            ? 0
            : -1
        }
        role={
          activeTab === 'consultation' ||
          activeTab === 'event' ||
          activeTab === 'party'
            ? 'button'
            : undefined
        }
        aria-label={
          activeTab === 'consultation' ||
          activeTab === 'event' ||
          activeTab === 'party'
            ? `${participant.name}の詳細を表示`
            : undefined
        }
      >
        <div className={hstack({ gap: '3', mb: '3' })}>
          {activeTab === 'consultation' ? (
            <Avatar
              src={participant.profileImage}
              alt={participant.name}
              size="md"
            />
          ) : (
            <Link href={`/user/${participant.userId}`}>
              <Avatar
                src={participant.profileImage}
                alt={participant.name}
                size="md"
              />
            </Link>
          )}
          <div>
            <div className={css({ fontWeight: 'bold' })}>
              {participant.name}
            </div>
            <div className={css({ fontSize: 'sm', color: 'gray.600' })}>
              {participant.companyName}
            </div>
          </div>
          <div
            className={css({
              ml: 'auto',
              px: '2',
              py: '1',
              borderRadius: 'full',
              fontSize: 'xs',
              bg:
                participant.status === '参加予定' ? 'green.100' : 'yellow.100',
              color:
                participant.status === '参加予定' ? 'green.800' : 'yellow.800',
            })}
          >
            {participant.status}
          </div>
        </div>
        <div className={vstack({ gap: '2', alignItems: 'stretch' })}>
          <div className={hstack({ justifyContent: 'space-between' })}>
            <span className={css({ fontSize: 'xs', color: 'gray.600' })}>
              メール:
            </span>
            <span
              className={css({
                fontSize: 'sm',
                fontWeight: 'medium',
                maxW: '60%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              })}
            >
              {participant.email}
            </span>
          </div>
          <div className={hstack({ justifyContent: 'space-between' })}>
            <span className={css({ fontSize: 'xs', color: 'gray.600' })}>
              電話:
            </span>
            <span className={css({ fontSize: 'sm' })}>{participant.phone}</span>
          </div>
          {activeTab === 'party' && participant.paymentStatus && (
            <div className={hstack({ justifyContent: 'space-between' })}>
              <span className={css({ fontSize: 'xs', color: 'gray.600' })}>
                決済:
              </span>
              <span
                className={css({
                  fontSize: 'sm',
                  px: '2',
                  py: '1',
                  borderRadius: 'full',
                  bg:
                    participant.paymentStatus === '支払い済み'
                      ? 'green.100'
                      : 'red.100',
                  color:
                    participant.paymentStatus === '支払い済み'
                      ? 'green.700'
                      : 'red.700',
                  fontWeight: 'medium',
                })}
              >
                {participant.paymentStatus}
              </span>
            </div>
          )}
          {activeTab === 'consultation' && (
            <>
              <div className={hstack({ justifyContent: 'space-between' })}>
                <span className={css({ fontSize: 'xs', color: 'gray.600' })}>
                  緊急相談:
                </span>
                <span
                  className={css({
                    fontSize: 'sm',
                    px: '2',
                    py: '1',
                    borderRadius: 'full',
                    bg: participant.is_urgent ? 'green.100' : 'gray.100',
                    color: participant.is_urgent ? 'green.700' : 'gray.700',
                    fontWeight: 'medium',
                  })}
                >
                  {participant.is_urgent ? 'はい' : 'いいえ'}
                </span>
              </div>
              <div className={hstack({ justifyContent: 'space-between' })}>
                <span className={css({ fontSize: 'xs', color: 'gray.600' })}>
                  初回相談:
                </span>
                <span
                  className={css({
                    fontSize: 'sm',
                    px: '2',
                    py: '1',
                    borderRadius: 'full',
                    bg: participant.is_first_consultation
                      ? 'green.100'
                      : 'gray.100',
                    color: participant.is_first_consultation
                      ? 'green.700'
                      : 'gray.700',
                    fontWeight: 'medium',
                  })}
                >
                  {participant.is_first_consultation ? 'はい' : 'いいえ'}
                </span>
              </div>
            </>
          )}
        </div>
        {activeTab !== 'consultation' && (
          <Link href={`/user/${participant.userId}`}>
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
        )}
      </div>
      <ConsultationDetailModal
        isOpen={consultationModal.isOpen}
        onClose={() =>
          setConsultationModal({
            isOpen: false,
            participant: null,
          })
        }
        participant={consultationModal.participant}
      />
      <EventParticipantDetailDialog
        open={participantDetailModal.isOpen}
        onOpenChange={(open) =>
          setParticipantDetailModal({
            isOpen: open,
            participant: open ? participantDetailModal.participant : null,
          })
        }
        participant={participantDetailModal.participant}
        eventId={eventId}
      />
    </>
  );
};
