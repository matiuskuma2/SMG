import { css } from '@/styled-system/css';

type EventConsultationInfoProps = {
  initialData?: {
    consultationCapacity?: number;
  };
};

export const EventConsultationInfo = ({
  initialData = {},
}: EventConsultationInfoProps) => {
  return (
    <div className={css({ mb: '6' })}>
      <h2
        className={css({
          fontSize: 'lg',
          fontWeight: 'bold',
          mb: '4',
          borderLeft: '4px solid',
          borderColor: 'blue.500',
          pl: '2',
        })}
      >
        個別相談会設定
      </h2>

      <div className={css({ mb: '4' })}>
        <label
          htmlFor="consultationCapacity"
          className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
        >
          定員数
        </label>
        <input
          id="consultationCapacity"
          type="number"
          name="consultationCapacity"
          min="0"
          className={css({
            border: '1px solid',
            borderColor: 'gray.300',
            p: '2',
            borderRadius: 'md',
            width: '100%',
            outline: 'none',
            _focus: { borderColor: 'blue.500' },
          })}
          placeholder="例: 10"
          defaultValue={initialData.consultationCapacity}
        />
      </div>
    </div>
  );
};
