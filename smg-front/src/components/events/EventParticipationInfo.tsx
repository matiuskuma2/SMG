import React from 'react';
import { css } from "@/styled-system/css";
import { flex } from "@/styled-system/patterns";
import type { EventParticipationInfoProps } from "@/types/event";

const EventParticipationInfo: React.FC<EventParticipationInfoProps> = ({ participants, event_capacity }) => {
  return (
    <div className={flex({ 
      gap: { base: '3', md: '4' }, 
      alignItems: 'center',
      width: '100%',
      justifyContent: 'space-between',
      p: { base: '3', md: '4' },
      borderRadius: 'lg'
    })}>
      <div className={css({ 
        textAlign: 'center',
        flex: '1',
        pr: { base: '3', md: '4' },
        bg: 'gray.50',
        p: '3',
        borderRadius: 'md',
        mr: { base: '3', md: '4' }
      })}>
        <div className={css({ color: 'gray.600', fontSize: { base: 'md', md: 'lg' } })}>定員数</div>
        <div className={css({ fontWeight: 'bold', fontSize: { base: 'lg', md: 'xl' } })}>{event_capacity}</div>
      </div>
      <div className={css({ 
        textAlign: 'center',
        flex: '1',
        pl: { base: '3', md: '4' },
        bg: 'blue.50',
        p: '3',
        borderRadius: 'md'
      })}>
        <div className={css({ color: 'blue.600', fontSize: { base: 'md', md: 'lg' } })}>参加予定</div>
        <div className={css({ fontWeight: 'bold', fontSize: { base: 'lg', md: 'xl' }, color: 'blue.700' })}>{participants}</div>
      </div>
    </div>
  );
};

export default EventParticipationInfo; 