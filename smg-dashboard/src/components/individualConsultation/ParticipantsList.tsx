import { Pagination } from '@/components/ui/Pagination';
import { css } from '@/styled-system/css';
import type { Participant } from '@/types/individualConsultation';
import { ParticipantCard } from './ParticipantCard';
import { ParticipantsTable } from './ParticipantsTable';

type ParticipantsListProps = {
  participants: Participant[];
  isMobile: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export const ParticipantsList = ({
  participants,
  isMobile,
  currentPage,
  totalPages,
  onPageChange,
}: ParticipantsListProps) => {
  return (
    <>
      {/* 参加者一覧（モバイルとデスクトップで表示切替） */}
      {isMobile ? (
        <div className={css({ width: 'full', pt: '2' })}>
          {participants.map((participant) => (
            <ParticipantCard
              key={participant.user_id}
              participant={participant}
            />
          ))}
        </div>
      ) : (
        <ParticipantsTable participants={participants} isMobile={isMobile} />
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
