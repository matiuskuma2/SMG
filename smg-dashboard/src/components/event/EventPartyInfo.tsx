import { css } from '@/styled-system/css';
import { useEffect, useState } from 'react';

type EventPartyInfoProps = {
  initialData?: {
    partyStartDateTime?: string;
    partyEndDateTime?: string;
    partyLocation?: string;
    partyFee?: number;
    partyCapacity?: number;
    partyRegistrationEndDateTime?: string;
  };
  onPartyInfoChange?: (hasInfo: boolean) => void;
};

export const EventPartyInfo = ({
  initialData = {},
  onPartyInfoChange,
}: EventPartyInfoProps) => {
  const [hasPartyInfo, setHasPartyInfo] = useState<boolean>(
    !!(
      initialData.partyStartDateTime ||
      initialData.partyLocation ||
      initialData.partyCapacity
    ),
  );

  useEffect(() => {
    onPartyInfoChange?.(hasPartyInfo);
  }, [hasPartyInfo, onPartyInfoChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const form = e.currentTarget.form;
    if (!form) return;

    const hasInfo = !!(
      form.partyStartDateTime.value ||
      form.partyLocation.value ||
      form.partyCapacity.value
    );
    setHasPartyInfo(hasInfo);
  };

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
        懇親会設定
      </h2>

      {/* 懇親会申込締切日 */}
      <div className={css({ mb: '4' })}>
        <label
          htmlFor="partyRegistrationEndDateTime"
          className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
        >
          懇親会申込締切日時
          <span className={css({ fontSize: 'xs', color: 'gray.500', ml: '2' })}>
            ※未設定の場合はイベント全体の申込締切日が適用されます
          </span>
        </label>
        <input
          id="partyRegistrationEndDateTime"
          type="datetime-local"
          name="partyRegistrationEndDateTime"
          autoComplete="one-time-code"
          className={css({
            border: '1px solid',
            borderColor: 'gray.300',
            p: '2',
            borderRadius: 'md',
            width: { base: '100%', md: '50%' },
            outline: 'none',
            _focus: { borderColor: 'blue.500' },
          })}
          defaultValue={initialData.partyRegistrationEndDateTime}
          onChange={handleInputChange}
        />
      </div>

      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: { base: '1fr', md: '1fr 1fr' },
          gap: '4',
          mb: '4',
        })}
      >
        <div>
          <label
            htmlFor="partyStartDateTime"
            className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
          >
            懇親会開始時刻
          </label>
          <div
            className={css({ display: 'flex', gap: '2', alignItems: 'center' })}
          >
            <input
              id="partyStartDateTime"
              type="datetime-local"
              name="partyStartDateTime"
              autoComplete="one-time-code"
              className={css({
                border: '1px solid',
                borderColor: 'gray.300',
                p: '2',
                borderRadius: 'md',
                flex: '1',
                outline: 'none',
                _focus: { borderColor: 'blue.500' },
              })}
              defaultValue={initialData.partyStartDateTime}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="partyEndDateTime"
            className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
          >
            懇親会終了時刻
          </label>
          <div
            className={css({ display: 'flex', gap: '2', alignItems: 'center' })}
          >
            <input
              id="partyEndDateTime"
              type="datetime-local"
              name="partyEndDateTime"
              autoComplete="one-time-code"
              className={css({
                border: '1px solid',
                borderColor: 'gray.300',
                p: '2',
                borderRadius: 'md',
                flex: '1',
                outline: 'none',
                _focus: { borderColor: 'blue.500' },
              })}
              defaultValue={initialData.partyEndDateTime}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>

      <div className={css({ mb: '4' })}>
        <label
          htmlFor="partyLocation"
          className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
        >
          懇親会場所
        </label>
        <input
          id="partyLocation"
          type="text"
          name="partyLocation"
          className={css({
            border: '1px solid',
            borderColor: 'gray.300',
            p: '2',
            borderRadius: 'md',
            width: '100%',
            outline: 'none',
            _focus: { borderColor: 'blue.500' },
          })}
          placeholder="例: 居酒屋〇〇"
          defaultValue={initialData.partyLocation}
          onChange={handleInputChange}
        />
      </div>

      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: { base: '1fr', md: '1fr 1fr' },
          gap: '4',
          mb: '4',
        })}
      >
        <div>
          <label
            htmlFor="partyFee"
            className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
          >
            参加費
          </label>
          <div className={css({ display: 'flex', alignItems: 'center' })}>
            <input
              id="partyFee"
              type="number"
              name="partyFee"
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
              placeholder="例: 5000"
              defaultValue={initialData.partyFee}
              onChange={handleInputChange}
            />
            <span className={css({ ml: '2' })}>円</span>
          </div>
        </div>

        <div>
          <label
            htmlFor="partyCapacity"
            className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
          >
            定員数
          </label>
          <input
            id="partyCapacity"
            type="number"
            name="partyCapacity"
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
            placeholder="例: 20"
            defaultValue={initialData.partyCapacity}
            onChange={handleInputChange}
          />
        </div>
      </div>
    </div>
  );
};
