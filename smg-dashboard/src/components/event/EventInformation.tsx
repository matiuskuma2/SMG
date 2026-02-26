import { css } from '@/styled-system/css';
import { hstack, vstack } from '@/styled-system/patterns';
import type { EventData } from './types';
import type { Participant } from './types';

type EventInformationProps = {
  eventData: EventData;
  activeTab: 'event' | 'party' | 'consultation';
  participants: Participant[];
};

export const EventInformation = ({
  eventData,
  activeTab,
  participants,
}: EventInformationProps) => {
  return (
    <div
      className={css({
        p: { base: '3', md: '6' },
        borderRadius: 'md',
        bg: 'white',
        boxShadow: 'sm',
        height: 'auto',
        display: 'flex',
        flexDirection: { base: 'column', md: 'row' },
        gap: { base: '4', md: '6' },
      })}
    >
      <div
        className={css({
          flex: { base: '1 1 auto', md: '0 0 300px' },
          height: { base: '200px', md: '100%' },
          bg: 'gray.100',
          borderRadius: 'md',
          overflow: 'hidden',
        })}
      >
        <img
          src={eventData.image_url || '/default-event-image.jpg'}
          alt={eventData.event_name}
          className={css({ width: '100%', height: '100%', objectFit: 'cover' })}
        />
      </div>
      <div
        className={vstack({
          gap: '4',
          alignItems: 'stretch',
          flex: '1',
          height: '100%',
          justifyContent: 'space-between',
        })}
      >
        <div>
          <h1
            className={css({
              fontSize: { base: 'xl', md: '2xl' },
              fontWeight: 'bold',
            })}
          >
            {eventData.event_name}
          </h1>
          <div className={css({ color: 'gray.600', mt: '2' })}>
            {activeTab === 'party' && eventData.has_gather ? (
              <>
                <p>
                  開催日時:{' '}
                  {eventData.gather_start_time
                    ? new Date(eventData.gather_start_time).toLocaleString()
                    : '未設定'}{' '}
                  〜{' '}
                  {eventData.gather_end_time
                    ? new Date(eventData.gather_end_time).toLocaleString()
                    : '未設定'}
                </p>
                <p>会場: {eventData.gather_location || '未設定'}</p>
              </>
            ) : activeTab === 'consultation' && eventData.has_consultation ? (
              <>
                <p>
                  開催日時:{' '}
                  {eventData.gather_start_time
                    ? new Date(eventData.gather_start_time).toLocaleString()
                    : '未設定'}{' '}
                  〜{' '}
                  {eventData.gather_end_time
                    ? new Date(eventData.gather_end_time).toLocaleString()
                    : '未設定'}
                </p>
                <p>
                  会場: {eventData.gather_location || eventData.event_location}
                  {eventData.event_city ? ` (${eventData.event_city})` : ''}
                </p>
              </>
            ) : (
              <>
                <p>
                  開催日時:{' '}
                  {new Date(eventData.event_start_datetime).toLocaleString()} 〜{' '}
                  {new Date(eventData.event_end_datetime).toLocaleString()}
                </p>
                <p>
                  会場: {eventData.event_location}
                  {eventData.event_city ? ` (${eventData.event_city})` : ''}
                </p>
              </>
            )}
          </div>
        </div>
        <div className={hstack({ gap: '4', mt: 'auto' })}>
          <div
            className={css({
              bg: 'blue.50',
              p: '3',
              borderRadius: 'md',
              textAlign: 'center',
              flex: '1',
            })}
          >
            <div className={css({ fontSize: 'sm', color: 'gray.600' })}>
              {activeTab === 'party'
                ? '懇親会参加者'
                : activeTab === 'consultation'
                  ? '相談会参加者'
                  : '参加予定者'}
            </div>
            <div className={css({ fontSize: 'xl', fontWeight: 'bold' })}>
              {activeTab === 'party'
                ? participants.filter((p) => !p.deleted_at).length
                : participants.length}
              人
            </div>
          </div>
          <div
            className={css({
              bg: 'gray.50',
              p: '3',
              borderRadius: 'md',
              textAlign: 'center',
              flex: '1',
            })}
          >
            <div className={css({ fontSize: 'sm', color: 'gray.600' })}>
              定員
            </div>
            <div className={css({ fontSize: 'xl', fontWeight: 'bold' })}>
              {activeTab === 'party' && eventData.has_gather
                ? `${eventData.gather_capacity}人`
                : activeTab === 'consultation' && eventData.has_consultation
                  ? `${eventData.consultation_capacity}人`
                  : `${eventData.event_capacity}人`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
