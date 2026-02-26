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

interface EventListCardsProps {
  events: Event[];
  handleViewParticipants: (eventId: string) => void;
  handleEdit: (eventId: string) => void;
  handleDelete: (eventId: string) => void;
  eventTypes: { [key: string]: string };
}

export const EventListCards: React.FC<EventListCardsProps> = ({
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
        display: { base: 'block', xl: 'none' },
      })}
    >
      {events.map((event) => (
        <div
          key={event.event_id}
          className={css({
            borderBottom: '1px solid',
            borderColor: 'gray.200',
            p: '4',
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
                {event.event_name}
              </div>
              <div className={css({ color: 'gray.600', fontSize: 'sm' })}>
                {eventTypes[event.event_type] || '未設定'}
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
                開催日:
              </div>
              <div className={css({ fontSize: 'sm' })}>
                {formatDateRange(
                  event.event_start_datetime,
                  event.event_end_datetime,
                )}
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
                申込み期間:
              </div>
              <div className={css({ fontSize: 'sm' })}>
                {formatDateRange(
                  event.registration_start_datetime,
                  event.registration_end_datetime,
                )}
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
                定員数:
              </div>
              <div className={css({ fontSize: 'sm' })}>
                {event.event_capacity}人
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
                申込者数:
              </div>
              <div className={css({ fontSize: 'sm' })}>
                {event.attendees?.[0]?.count || 0}人
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
                ステータス:
              </div>
              <div className={css({ fontSize: 'sm' })}>
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
                投稿日:
              </div>
              <div className={css({ fontSize: 'sm' })}>
                {event.created_at ? formatIsoDate(event.created_at) : '未設定'}
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
        </div>
      ))}
    </div>
  );
};
