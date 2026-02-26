import { Avatar } from '@/components/ui/Avatar';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import type { Participant } from '@/types/individualConsultation';
import { formatIsoDate } from '@/utils/date';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ParticipantsDetailDialog } from './ParticipantsDetailDialog';

type ParticipantsTableProps = {
  participants: Participant[];
  isMobile: boolean;
};

type Column = {
  key: string;
  label: string;
  width?: string;
};

export const ParticipantsTable = ({
  participants,
  isMobile,
}: ParticipantsTableProps) => {
  // タブごとの列の定義
  const getColumns = (): Column[] => {
    const baseColumns: Column[] = [
      { key: 'icon', label: '', width: '40px' },
      { key: 'name', label: '名前', width: '80px' },
      { key: 'email', label: 'メールアドレス', width: '220px' },
      { key: 'phone', label: '電話番号', width: '120px' },
      { key: 'userType', label: '属性', width: '80px' },
      { key: 'firstTime', label: '初回相談', width: '80px' },
      { key: 'candidateDateAndTime', label: '当選日時', width: '200px' },
      { key: 'remarks', label: '備考', width: '180px' },
    ];

    // モバイル対応
    if (isMobile) {
      return [
        { key: 'icon', label: '' },
        { key: 'name', label: '名前' },
        { key: 'email', label: 'メールアドレス' },
        { key: 'phone', label: '電話番号' },
        { key: 'userType', label: '属性' },
        { key: 'firstTime', label: '初回相談' },
        { key: 'candidateDateAndTime', label: '当選日時' },
        { key: 'remarks', label: '備考' },
      ];
    }

    return baseColumns;
  };

  const columns = getColumns();

  const [candidateMap, setCandidateMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // 初期表示時にselected_candidate_idに対応する日時を設定
    const initialCandidateMap: Record<string, string> = {};
    for (const participant of participants) {
      if (participant.selected_candidate_id) {
        const selectedSchedule = participant.candidateDateAndTime.find(
          (date) => date.schedule_id === participant.selected_candidate_id,
        );
        if (selectedSchedule) {
          initialCandidateMap[participant.user_id] =
            selectedSchedule.schedule_datetime;
        }
      }
    }
    setCandidateMap(initialCandidateMap);
  }, [participants]);

  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleClick = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsDialogOpen(true);
  };

  const handleScheduleChange = async (
    participant: Participant,
    selectedDateTime: string,
  ) => {
    try {
      const supabase = createClient();
      let updateData: {
        selected_candidate_id: string | null;
        selection_status: string;
      } = {
        selected_candidate_id: null,
        selection_status: 'pending',
      };

      if (selectedDateTime !== '') {
        // 選択された日時に対応するschedule_idを探す
        const selectedSchedule = participant.candidateDateAndTime.find(
          (date) => date.schedule_datetime === selectedDateTime,
        );

        if (!selectedSchedule) {
          console.error('選択された日時に対応するスケジュールが見つかりません');
          return;
        }

        updateData = {
          selected_candidate_id: selectedSchedule.schedule_id,
          selection_status: 'approved',
        };
      }

      // trn_consultation_applicationテーブルを更新
      const { error } = await supabase
        .from('trn_consultation_application')
        .update(updateData)
        .eq('user_id', participant.user_id)
        .eq('consultation_id', participant.consultation_id)
        .is('deleted_at', null);

      if (error) {
        console.error('スケジュールの更新に失敗しました:', error);
        return;
      }

      // ローカルの状態も更新
      setCandidateMap((prev) => ({
        ...prev,
        [participant.user_id]: selectedDateTime,
      }));
    } catch (error) {
      console.error('スケジュールの更新中にエラーが発生しました:', error);
    }
  };

  return (
    <div
      className={css({ overflowX: 'auto', borderRadius: 'md', width: 'full' })}
    >
      <table
        className={css({
          width: 'full',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        })}
      >
        <thead>
          <tr
            className={css({
              bg: '#f7fafc',
              borderBottom: '1px solid #e2e8f0',
            })}
          >
            {columns.map((column) => (
              <th
                key={column.key}
                style={{ width: column.width }}
                className={css({
                  p: '3',
                  textAlign: 'left',
                  fontWeight: 'normal',
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
              key={participant.user_id}
              onClick={() => handleClick(participant)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleClick(participant);
                }
              }}
              className={css({
                borderBottom: '1px solid #e2e8f0',
                _hover: { bg: '#f7fafc', cursor: 'pointer' },
              })}
            >
              {columns.map((column) => (
                <td
                  key={`${participant.user_id}-${column.key}`}
                  style={{
                    width: columns.find((c) => c.key === column.key)?.width,
                  }}
                  className={css({ p: '3', fontSize: 'sm' })}
                >
                  {column.key === 'icon' && (
                    <Link href={`/user/${participant.user_id}`}>
                      <Avatar
                        src={participant.icon || ''}
                        alt={participant.username || ''}
                        size="sm"
                      />
                    </Link>
                  )}
                  {column.key === 'name' && (
                    <Link href={`/user/${participant.user_id}`}>
                      {participant.username || ''}
                    </Link>
                  )}
                  {column.key === 'email' && (
                    <Link href={`mailto:${participant.email}`}>
                      {participant.email}
                    </Link>
                  )}
                  {column.key === 'phone' && (
                    <Link href={`tel:${participant.phone_number}`}>
                      {participant.phone_number || ''}
                    </Link>
                  )}
                  {column.key === 'userType' && (
                    <span>{participant.user_type || ''}</span>
                  )}
                  {column.key === 'firstTime' && (
                    <span>{participant.firstTime ? '初回' : '再訪'}</span>
                  )}
                  {column.key === 'candidateDateAndTime' && (
                    <select
                      value={candidateMap[participant.user_id] ?? ''}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const selected = e.target.value;
                        handleScheduleChange(participant, selected);
                      }}
                      className={css({
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
                      {participant.candidateDateAndTime.length > 0 &&
                        participant.candidateDateAndTime.map((date) => (
                          <option
                            key={date.schedule_datetime}
                            value={date.schedule_datetime}
                          >
                            第{date.candidateRanking}希望：
                            {formatIsoDate(date.schedule_datetime)}
                          </option>
                        ))}
                    </select>
                  )}
                  {column.key === 'remarks' && (
                    <span
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'normal',
                        lineHeight: '1.5',
                      }}
                      className={css({ fontSize: 'sm' })}
                    >
                      {participant.remarks}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ParticipantsDetailDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        participant={selectedParticipant}
      />
    </div>
  );
};
