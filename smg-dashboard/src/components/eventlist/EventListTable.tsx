import { ActionButtons } from '@/components/ui/ActionIconButton';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import { formatDateRange } from '@/utils/date';
import { formatIsoDate } from '@/utils/date';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { FaBoxArchive, FaBoxOpen, FaUsers } from 'react-icons/fa6';
import type { Event } from '../event/types';

interface EventListTableProps {
  events: Event[];
  handleViewParticipants: (eventId: string) => void;
  handleEdit: (eventId: string) => void;
  handleDelete: (eventId: string) => void;
  eventTypes: { [key: string]: string };
}

export const EventListTable: React.FC<EventListTableProps> = ({
  events,
  handleViewParticipants,
  handleEdit,
  handleDelete,
  eventTypes,
}) => {
  const router = useRouter();
  const supabase = createClient();

  const handleArchive = async (eventId: string) => {
    try {
      // アーカイブの存在確認
      const { data, error } = await supabase
        .from('mst_event_archive')
        .select('archive_id')
        .eq('event_id', eventId)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) {
        console.error('アーカイブ検索エラー:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      if (data) {
        // アーカイブが存在する場合は編集ページへ
        router.push(`/event/archive/${eventId}?archiveId=${data.archive_id}`);
      } else {
        // アーカイブが存在しない場合は作成ページへ
        router.push(`/event/archive/${eventId}`);
      }
    } catch (error) {
      console.error('アーカイブアクセスエラー:', {
        message: error instanceof Error ? error.message : '不明なエラー',
        error,
      });
      alert(
        'アーカイブ情報の取得に失敗しました。\n詳細はコンソールを確認してください。',
      );
    }
  };

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
                minW: '120px',
              })}
            >
              開催日
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                minW: '180px',
              })}
            >
              申込み期間
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
              開催区分
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                textAlign: 'center',
              })}
            >
              定員数
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                textAlign: 'center',
              })}
            >
              申込者数
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
              イベント名
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                minW: '100px',
                textAlign: 'center',
              })}
            >
              ステータス
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
              投稿日
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
          {events.map((event) => (
            <tr
              key={event.event_id}
              className={css({
                borderBottom: '1px solid',
                borderColor: 'gray.200',
                _hover: { bg: 'gray.50' },
              })}
            >
              <td className={css({ py: '3', px: '4' })}>
                {formatDateRange(
                  event.event_start_datetime,
                  event.event_end_datetime,
                )}
              </td>
              <td className={css({ py: '3', px: '4' })}>
                {formatDateRange(
                  event.registration_start_datetime,
                  event.registration_end_datetime,
                )}
              </td>
              <td className={css({ py: '3', px: '4' })}>
                {eventTypes[event.event_type] || '未設定'}
              </td>
              <td className={css({ py: '3', px: '4', textAlign: 'center' })}>
                {event.event_capacity}
              </td>
              <td className={css({ py: '3', px: '4', textAlign: 'center' })}>
                {event.attendees?.[0]?.count || 0}
              </td>
              <td className={css({ py: '3', px: '4' })}>{event.event_name}</td>
              <td className={css({ py: '3', px: '4', textAlign: 'center' })}>
                {event.is_draft ? (
                  <span
                    className={css({
                      color: 'gray.500',
                      fontStyle: 'italic',
                      fontWeight: 'medium',
                    })}
                  >
                    下書き
                  </span>
                ) : (
                  <span
                    className={css({
                      color: 'green.600',
                      fontWeight: 'medium',
                    })}
                  >
                    公開
                  </span>
                )}
              </td>
              <td className={css({ py: '3', px: '4' })}>
                {formatIsoDate(event.created_at || '')}
              </td>
              <td className={css({ py: '3', px: '4' })}>
                <div className={css({ display: 'flex', gap: '2' })}>
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label="参加者一覧"
                    className={css({
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      px: '2',
                      py: '2',
                      borderRadius: 'md',
                      cursor: 'pointer',
                      width: '32px',
                      height: '32px',
                      bg: 'green.400',
                      color: 'white',
                      borderColor: 'green.600',
                      _hover: { bg: 'green.700', color: 'white' },
                    })}
                    onClick={() => handleViewParticipants(event.event_id)}
                  >
                    <FaUsers size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label="アーカイブ"
                    className={css({
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      px: '2',
                      py: '2',
                      borderRadius: 'md',
                      cursor: 'pointer',
                      width: '32px',
                      height: '32px',
                      bg: event.has_archive
                        ? event.archive_is_draft
                          ? 'gray.400'
                          : 'purple.600'
                        : 'purple.300',
                      color: 'white',
                      borderColor: event.has_archive
                        ? event.archive_is_draft
                          ? 'gray.500'
                          : 'purple.700'
                        : 'purple.400',
                      _hover: {
                        bg: event.has_archive
                          ? event.archive_is_draft
                            ? 'gray.600'
                            : 'purple.800'
                          : 'purple.500',
                        color: 'white',
                      },
                    })}
                    onClick={() => handleArchive(event.event_id)}
                  >
                    {event.has_archive ? (
                      <FaBoxArchive size={14} />
                    ) : (
                      <FaBoxOpen size={14} />
                    )}
                  </Button>
                  <ActionButtons
                    targetId={event.event_id}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
