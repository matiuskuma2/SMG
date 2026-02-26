import { Button } from '@/components/ui/button';
import { css } from '@/styled-system/css';
import type React from 'react';
import { FaPlus } from 'react-icons/fa';

interface EventListHeaderProps {
  handleCreateEvent: () => void;
}

export const EventListHeader: React.FC<EventListHeaderProps> = ({
  handleCreateEvent,
}) => {
  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'gray.200',
        p: { base: '3', xl: '4' },
        position: 'relative',
      })}
    >
      <h1
        className={css({
          fontSize: { base: 'lg', xl: 'xl' },
          fontWeight: 'bold',
        })}
      >
        イベント
      </h1>
      <Button
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '2',
          bg: 'blue.600',
          color: 'white',
          _hover: { bg: 'blue.700' },
          px: { base: '3', xl: '4' },
          py: { base: '1.5', xl: '2' },
          rounded: 'md',
          position: 'absolute',
          right: { base: '2', xl: '4' },
          fontSize: { base: 'sm', xl: 'md' },
          whiteSpace: 'nowrap',
          mt: { base: '2', xl: '0' },
          cursor: 'pointer',
        })}
        onClick={handleCreateEvent}
      >
        <FaPlus
          size={14}
          className={css({ display: { base: 'none', xl: 'block' } })}
        />
        <span className={css({ display: { base: 'none', xl: 'inline' } })}>
          イベントの作成
        </span>
        <span className={css({ display: { base: 'inline', xl: 'none' } })}>
          作成
        </span>
      </Button>
    </div>
  );
};
