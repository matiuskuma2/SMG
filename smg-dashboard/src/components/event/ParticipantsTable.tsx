import { Avatar } from '@/components/ui/Avatar';
import { css } from '@/styled-system/css';
import Link from 'next/link';
import { useState } from 'react';
import { ConfirmModal } from './ConfirmModal';
import { ConsultationDetailModal } from './ConsultationDetailModal';
import { EventParticipantDetailDialog } from './EventParticipantDetailDialog';
import type { Participant } from './types';

type ParticipantsTableProps = {
  participants: Participant[];
  activeTab: 'event' | 'party' | 'consultation';
  isMobile: boolean;
  onRefund?: (participantId: string, paymentIntentId: string) => Promise<void>;
  eventId?: string;
};

export const ParticipantsTable = ({
  participants,
  activeTab,
  isMobile,
  onRefund,
  eventId,
}: ParticipantsTableProps) => {
  const [refundModal, setRefundModal] = useState<{
    isOpen: boolean;
    participantId: string;
    paymentIntentId: string;
  }>({
    isOpen: false,
    participantId: '',
    paymentIntentId: '',
  });

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

  // タブごとの列の定義
  const getColumns = () => {
    const baseColumns = [
      { key: 'icon', label: '' },
      { key: 'name', label: '名前' },
      { key: 'companyName', label: '会社名' },
      { key: 'status', label: '申込状況' },
      { key: 'email', label: 'メールアドレス' },
      { key: 'phone', label: '電話番号' },
      { key: 'userType', label: '属性' },
      { key: 'groupAffiliation', label: '所属グループ' },
    ];

    // モバイル用に表示する重要な列を制限
    if (isMobile) {
      return [
        { key: 'icon', label: '' },
        { key: 'name', label: '名前' },
        { key: 'companyName', label: '会社名' },
        { key: 'status', label: '申込状況' },
      ];
    }

    switch (activeTab) {
      case 'event':
        return [
          ...baseColumns.slice(0, 4),
          { key: 'participationType', label: '参加方法' },
          ...baseColumns.slice(4),
        ];
      case 'party':
        return [
          ...baseColumns,
          { key: 'paymentStatus', label: '決済状況' },
          { key: 'actions', label: 'アクション' },
        ];
      case 'consultation':
        return [
          ...baseColumns,
          { key: 'is_urgent', label: '緊急相談' },
          { key: 'is_first_consultation', label: '初回相談' },
        ];
      default:
        return baseColumns;
    }
  };

  const columns = getColumns();

  const handleRefundClick = (
    participantId: string,
    paymentIntentId: string,
  ) => {
    setRefundModal({
      isOpen: true,
      participantId,
      paymentIntentId,
    });
  };

  const handleRefundConfirm = async () => {
    if (onRefund) {
      await onRefund(refundModal.participantId, refundModal.paymentIntentId);
    }
    setRefundModal({ isOpen: false, participantId: '', paymentIntentId: '' });
  };

  const handleUserClick = (participant: Participant) => {
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

  const handleKeyDown = (e: React.KeyboardEvent, participant: Participant) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleUserClick(participant);
    }
  };

  return (
    <>
      <div
        className={css({
          overflowX: 'auto',
          borderRadius: 'md',
          width: 'full',
        })}
      >
        <table className={css({ width: 'full', borderCollapse: 'collapse' })}>
          <thead>
            <tr
              className={css({
                bg: '#f7fafc',
                borderBottom: '1px solid #e2e8f0',
              })}
            >
              <th className={css({ p: '3', textAlign: 'center' })}>
                <input type="checkbox" />
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={css({
                    p: '3',
                    textAlign: 'left',
                    fontWeight: 'semibold',
                    fontSize: 'sm',
                  })}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => (
              <tr
                key={participant.id}
                className={css({
                  borderBottom: '1px solid #e2e8f0',
                  _hover: { bg: '#f7fafc' },
                  cursor:
                    activeTab === 'consultation' ||
                    activeTab === 'event' ||
                    activeTab === 'party'
                      ? 'pointer'
                      : 'default',
                })}
                onClick={() => handleUserClick(participant)}
                onKeyDown={(e) => handleKeyDown(e, participant)}
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
                <td className={css({ p: '3', textAlign: 'center' })}>
                  <input type="checkbox" />
                </td>
                {columns.map((column) => (
                  <td
                    key={`${participant.id}-${column.key}`}
                    className={css({ p: '3', fontSize: 'sm' })}
                  >
                    {column.key === 'icon' ? (
                      activeTab === 'consultation' ? (
                        <Avatar
                          src={participant.profileImage}
                          alt={participant.name}
                          size="sm"
                        />
                      ) : (
                        <Link href={`/user/${participant.userId}`}>
                          <Avatar
                            src={participant.profileImage}
                            alt={participant.name}
                            size="sm"
                          />
                        </Link>
                      )
                    ) : column.key === 'is_urgent' ||
                      column.key === 'is_first_consultation' ? (
                      <span
                        className={css({
                          px: '2',
                          py: '1',
                          borderRadius: 'full',
                          bg: participant[column.key]
                            ? 'green.100'
                            : 'gray.100',
                          color: participant[column.key]
                            ? 'green.700'
                            : 'gray.700',
                          fontSize: 'xs',
                          fontWeight: 'medium',
                        })}
                      >
                        {participant[column.key] ? 'はい' : 'いいえ'}
                      </span>
                    ) : column.key === 'paymentStatus' &&
                      participant.paymentStatus ? (
                      <span
                        className={css({
                          px: '2',
                          py: '1',
                          borderRadius: 'full',
                          bg:
                            participant.paymentStatus === '支払い済み' ||
                            participant.paymentStatus === 'succeeded'
                              ? 'green.100'
                              : participant.paymentStatus === 'refunded' ||
                                  participant.paymentStatus ===
                                    'already_refunded'
                                ? 'gray.100'
                                : 'red.100',
                          color:
                            participant.paymentStatus === '支払い済み' ||
                            participant.paymentStatus === 'succeeded'
                              ? 'green.700'
                              : participant.paymentStatus === 'refunded' ||
                                  participant.paymentStatus ===
                                    'already_refunded'
                                ? 'gray.700'
                                : 'red.700',
                          fontSize: 'xs',
                          fontWeight: 'medium',
                        })}
                      >
                        {participant.paymentStatus === 'refunded' ||
                        participant.paymentStatus === 'already_refunded'
                          ? '返金済み'
                          : participant.paymentStatus === 'succeeded'
                            ? '支払い済み'
                            : participant.paymentStatus}
                      </span>
                    ) : column.key === 'participationType' ? (
                      <>
                        <span
                          className={css({
                            px: '2',
                            py: '1',
                            borderRadius: 'full',
                            bg:
                              participant.is_offline === true
                                ? 'blue.100'
                                : 'purple.100',
                            color:
                              participant.is_offline === true
                                ? 'blue.700'
                                : 'purple.700',
                            fontSize: 'xs',
                            fontWeight: 'medium',
                          })}
                        >
                          {participant.is_offline === true
                            ? 'オフライン'
                            : 'オンライン'}
                        </span>
                      </>
                    ) : column.key === 'actions' && activeTab === 'party' ? (
                      <>
                        {participant.paymentIntentId &&
                          onRefund &&
                          (participant.paymentStatus === 'refunded' ||
                          participant.paymentStatus === 'already_refunded' ? (
                            <span
                              className={css({
                                px: '3',
                                py: '1',
                                bg: 'gray.200',
                                color: 'gray.600',
                                borderRadius: 'md',
                                fontSize: 'xs',
                                fontWeight: 'medium',
                              })}
                            >
                              返金済み
                            </span>
                          ) : (
                            (participant.paymentStatus === '支払い済み' ||
                              participant.paymentStatus === 'succeeded') && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRefundClick(
                                    participant.userId,
                                    participant.paymentIntentId as string,
                                  );
                                }}
                                className={css({
                                  px: '3',
                                  py: '1',
                                  bg: 'red.500',
                                  color: 'white',
                                  borderRadius: 'md',
                                  fontSize: 'xs',
                                  fontWeight: 'medium',
                                  _hover: { bg: 'red.600' },
                                  _disabled: {
                                    bg: 'gray.300',
                                    cursor: 'not-allowed',
                                  },
                                })}
                              >
                                返金する
                              </button>
                            )
                          ))}
                      </>
                    ) : (
                      <span>
                        {participant[column.key as keyof typeof participant]}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        isOpen={refundModal.isOpen}
        onClose={() =>
          setRefundModal({
            isOpen: false,
            participantId: '',
            paymentIntentId: '',
          })
        }
        onConfirm={handleRefundConfirm}
        title="返金の確認"
        message="この参加者の料金を返金しますか？この操作は取り消せません。"
        confirmText="返金する"
        cancelText="キャンセル"
      />
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
