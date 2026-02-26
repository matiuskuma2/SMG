import { css } from '@/styled-system/css';
import { useState } from 'react';
import type { EventData, Participant } from './types';

type ParticipantsTabsProps = {
  eventData: EventData;
  activeTab: 'event' | 'party' | 'consultation';
  handleTabChange: (tab: 'event' | 'party' | 'consultation') => void;
  participantsMap: {
    event: Participant[];
    party: Participant[];
    consultation: Participant[];
  };
};

export const ParticipantsTabs = ({
  eventData,
  activeTab,
  handleTabChange,
  participantsMap,
}: ParticipantsTabsProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const handleExportSpreadsheet = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const eventParticipants = participantsMap.event;
      const partyParticipants = participantsMap.party;
      const consultationParticipants = participantsMap.consultation;
      const response = await fetch('/api/export-event-spreadsheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventParticipants,
          partyParticipants,
          consultationParticipants,
          eventData,
        }),
      });

      if (!response.ok) {
        throw new Error('スプレッドシートのエクスポートに失敗しました');
      }

      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error(
        'スプレッドシートのエクスポート中にエラーが発生しました:',
        error,
      );
      alert('スプレッドシートのエクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenSpreadsheet = async () => {
    if (isOpening) return;
    setIsOpening(true);

    try {
      const response = await fetch('/api/open-event-spreadsheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: eventData.event_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'スプレッドシートを開くのに失敗しました',
        );
      }

      const data = await response.json();

      // 新しいタブでスプレッドシートを開く
      window.open(data.spreadsheetUrl, '_blank');
    } catch (error) {
      console.error('スプレッドシートを開く中にエラーが発生しました:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'スプレッドシートを開くのに失敗しました',
      );
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <div
      className={css({
        display: 'flex',
        flexDirection: 'column',
        gap: '3',
        borderBottom: '1px solid #e2e8f0',
        width: 'full',
      })}
    >
      <div
        className={css({
          display: 'flex',
          flexDirection: { base: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { base: 'flex-start', md: 'center' },
          width: 'full',
          gap: { base: '3', md: '0' },
        })}
      >
        <div
          className={css({
            display: 'flex',
            overflowX: 'auto',
            width: { base: 'full', md: 'auto' },
            pb: { base: '1', md: '0' },
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          })}
        >
          <button
            type="button"
            className={css({
              px: '4',
              py: '2',
              fontWeight: activeTab === 'event' ? 'bold' : 'normal',
              borderBottom:
                activeTab === 'event' ? '2px solid #3182ce' : 'none',
              color: activeTab === 'event' ? '#3182ce' : 'inherit',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            })}
            onClick={() => handleTabChange('event')}
          >
            イベント
          </button>
          <button
            type="button"
            className={css({
              px: '4',
              py: '2',
              fontWeight: activeTab === 'party' ? 'bold' : 'normal',
              borderBottom:
                activeTab === 'party' ? '2px solid #3182ce' : 'none',
              color: activeTab === 'party' ? '#3182ce' : 'inherit',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            })}
            onClick={() => handleTabChange('party')}
          >
            懇親会
          </button>
          <button
            type="button"
            className={css({
              px: '4',
              py: '2',
              fontWeight: activeTab === 'consultation' ? 'bold' : 'normal',
              borderBottom:
                activeTab === 'consultation' ? '2px solid #3182ce' : 'none',
              color: activeTab === 'consultation' ? '#3182ce' : 'inherit',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            })}
            onClick={() => handleTabChange('consultation')}
          >
            個別相談会
          </button>
        </div>
        <div
          className={css({
            display: 'flex',
            gap: '2',
            flexDirection: { base: 'column', md: 'row' },
            width: { base: 'full', md: 'auto' },
          })}
        >
          <button
            type="button"
            onClick={handleOpenSpreadsheet}
            disabled={isOpening}
            className={css({
              bg: '#2c4f54',
              color: 'white',
              px: '4',
              py: '2',
              borderRadius: 'full',
              _hover: { bg: '#1f3134' },
              _disabled: {
                bg: '#a0aec0',
                cursor: 'not-allowed',
              },
              whiteSpace: 'nowrap',
              width: { base: 'full', md: 'auto' },
              transition: 'background-color 0.3s',
              cursor: isOpening ? 'not-allowed' : 'pointer',
            })}
          >
            {isOpening ? '開いています...' : 'ファイル表示'}
          </button>
          <button
            type="button"
            onClick={handleExportSpreadsheet}
            disabled={isExporting}
            className={css({
              bg: '#2c4f54',
              color: 'white',
              px: '4',
              py: '2',
              borderRadius: 'full',
              _hover: { bg: '#1f3134' },
              _disabled: {
                bg: '#a0aec0',
                cursor: 'not-allowed',
              },
              whiteSpace: 'nowrap',
              width: { base: 'full', md: 'auto' },
              transition: 'background-color 0.3s',
              cursor: isExporting ? 'not-allowed' : 'pointer',
            })}
          >
            {isExporting ? '出力中...' : 'ファイル出力'}
          </button>
        </div>
      </div>
    </div>
  );
};
