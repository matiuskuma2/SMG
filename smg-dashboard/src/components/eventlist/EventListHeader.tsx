import { Button } from '@/components/ui/button';
import { css } from '@/styled-system/css';
import type React from 'react';
import { FaCog, FaPlus } from 'react-icons/fa';

interface EventListHeaderProps {
  handleCreateEvent: () => void;
  onOpenTypeSettings?: () => void;
}

export const EventListHeader: React.FC<EventListHeaderProps> = ({
  handleCreateEvent,
  onOpenTypeSettings,
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
      {/* 左側: 表示設定ボタン */}
      {onOpenTypeSettings && (
        <Button
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '1',
            bg: 'transparent',
            color: 'gray.500',
            _hover: { bg: 'gray.100', color: 'gray.700' },
            px: { base: '2', xl: '3' },
            py: { base: '1', xl: '1.5' },
            rounded: 'md',
            position: 'absolute',
            left: { base: '2', xl: '4' },
            fontSize: { base: 'xs', xl: 'sm' },
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            border: '1px solid',
            borderColor: 'gray.300',
          })}
          onClick={onOpenTypeSettings}
        >
          <FaCog size={12} />
          <span className={css({ display: { base: 'none', xl: 'inline' } })}>
            表示設定
          </span>
        </Button>
      )}

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
