import React from 'react';
import { css } from '@/styled-system/css';
import type { EventTypeCheckboxProps } from '@/types/event';

const EventTypeCheckbox: React.FC<EventTypeCheckboxProps> = ({ event_type, checked, onChange, disabled = false, participantCount, capacity, isRegularMeeting = false }) => {
  const getTypeLabel = (event_type: string) => {
    switch (event_type) {
      case 'Event':
        return 'イベント';
      case 'Networking':
        return isRegularMeeting ? '懇親会※立食' : '懇親会';
      case 'Consultation':
        return '個別相談 ※定員枠を超えた場合は抽選';
      default:
        return event_type;
    }
  };

  return (
    <label className={css({ 
      display: 'block',
      mb: '3',
      cursor: disabled ? 'not-allowed' : 'pointer',
      position: 'relative',
      borderRadius: 'md',
      border: '1px solid',
      borderColor: checked ? 'green.500' : 'gray.200',
      overflow: 'hidden',
      opacity: disabled ? 0.5 : 1,
    })}>
      <input
        type="checkbox"
        name="eventType"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={css({
          position: 'absolute',
          left: '3',
          top: '50%',
          transform: 'translateY(-50%)',
          w: '4',
          h: '4',
          appearance: 'none',
          border: '1px solid',
          borderColor: checked ? 'green.500' : 'gray.400',
          rounded: 'full',
          bg: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '1',
          cursor: disabled ? 'not-allowed' : 'pointer',
          _checked: {
            borderColor: 'green.500',
            bg: 'white',
            _before: {
              content: '""',
              position: 'absolute',
              width: '2',
              height: '2',
              bg: 'green.500',
              borderRadius: 'full',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }
          }
        })}
      />
      <div className={css({
        py: '3',
        px: '10',
        bg: checked ? 'green.50' : 'white',
        color: checked ? 'green.700' : 'gray.800',
        fontSize: 'md',
        textAlign: 'center',
        transition: 'all 0.2s ease',
        _hover: {
          bg: checked ? 'green.50' : 'gray.50'
        }
      })}>
        <div>{getTypeLabel(event_type)}</div>
        {participantCount !== undefined && capacity !== undefined && capacity > 0 && (
          <div className={css({
            fontSize: 'xs',
            color: 'gray.600',
            mt: '1'
          })}>
            {participantCount !== undefined && capacity !== undefined && participantCount >= capacity ? '定員に達しました' : `${participantCount}/${capacity}名`}
          </div>
        )}
      </div>
    </label>
  );
};

export default EventTypeCheckbox; 