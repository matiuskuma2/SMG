import React from 'react';
import { css } from "@/styled-system/css";
import { stack } from "@/styled-system/patterns";
import type { EventNotesProps } from '@/types/event';

const EventNotes: React.FC<EventNotesProps> = ({ notes }) => {
  if (!notes || notes.length === 0) return null;

  return (
    <div className={css({ 
      mb: { base: '6', md: '8' }, 
      mt: { base: '6', md: '8' } 
    })}>
      <h2 className={css({ 
        fontSize: { base: 'md', md: 'lg' }, 
        fontWeight: 'bold', 
        mb: { base: '2', md: '4' } 
      })}>注意事項</h2>
      <ul className={stack({ gap: '2' })}>
        {notes.map((note, index) => (
          <li key={index} className={css({ fontSize: 'sm', color: 'gray.600' })}>{note}</li>
        ))}
      </ul>
    </div>
  );
};

export default EventNotes; 