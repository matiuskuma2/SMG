import { css } from "@/styled-system/css";
import { BackButton } from "@/components/ui/BackButton";
import type { EventHeaderProps } from "@/types/event";
import { useIsInstructor } from "@/hooks/useIsInstructor";

interface EventHeaderComponentProps extends EventHeaderProps {
  onEdit?: () => void;
}

export const EventHeader = ({ date, event_name, event_location, onEdit }: EventHeaderComponentProps) => {
  const { isInstructor, loading } = useIsInstructor();

  return (
    <div className={css({})}>
      <div className={css({
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: { base: '2', md: '4' }
      })}>
        <BackButton />
        {onEdit && !loading && isInstructor && (
          <button
            onClick={onEdit}
            className={css({
              px: '4',
              py: '2',
              bg: 'blue.600',
              color: 'white',
              borderRadius: 'md',
              fontSize: 'sm',
              fontWeight: 'medium',
              cursor: 'pointer',
              transition: 'all 0.2s',
              _hover: {
                bg: 'blue.700',
              },
              _active: {
                transform: 'scale(0.98)',
              },
            })}
          >
            編集
          </button>
        )}
      </div>

      <div className={css({
        backgroundColor: 'white',
        color: 'black',
        borderRadius: 'lg',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: { base: '12', md: '14' },
        boxShadow: 'md'
      })}>
        <div className={css({ 
          fontSize: 'xs', 
          fontWeight: 'bold',
          backgroundColor: 'red.500',
          padding: '0.5',
          width: 'full',
          textAlign: 'center',
          color: 'white',
          borderTopLeftRadius: 'lg',
          borderTopRightRadius: 'lg'
        })}>{date.split('/')[0]}月</div>
        <div className={css({ 
          fontSize: 'xl', 
          fontWeight: 'bold',
          padding: '0.5',
          width: 'full',
          textAlign: 'center'
        })}>{date.split('/')[1]}</div>
      </div>

      <div className={css({ position: 'relative',   mt: '4' })}>
        <div className={css({})}></div>
        <h1 className={css({ fontSize: 'xl', fontWeight: 'bold', mb: '2' })}>{event_name}</h1>
        <div className={css({ fontSize: 'sm', color: 'gray.600' })}>{event_location}</div>
      </div>
    </div>
  );
}; 