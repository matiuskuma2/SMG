import { Pagination } from '@/components/ui/Pagination';
import { css } from '@/styled-system/css';
import { ParticipantCard } from './ParticipantCard';
import { ParticipantsTable } from './ParticipantsTable';
import type { Participant } from './types';

type ParticipantsListProps = {
  participants: Participant[];
  activeTab: 'event' | 'party' | 'consultation';
  isMobile: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefund?: (participantId: string, paymentIntentId: string) => Promise<void>;
  eventId?: string;
};

export const ParticipantsList = ({
  participants,
  activeTab,
  isMobile,
  currentPage,
  totalPages,
  onPageChange,
  onRefund,
  eventId,
}: ParticipantsListProps) => {
  return (
    <>
      {/* 参加者一覧（モバイルとデスクトップで表示切替） */}
      {isMobile ? (
        <div className={css({ width: 'full', pt: '2' })}>
          {participants.map((participant) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              activeTab={activeTab}
              eventId={eventId}
            />
          ))}
        </div>
      ) : (
        <ParticipantsTable
          participants={participants}
          activeTab={activeTab}
          isMobile={isMobile}
          onRefund={onRefund}
          eventId={eventId}
        />
      )}

      {/* Paginationコンポーネントを使用 */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
};
