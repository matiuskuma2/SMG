import { Input } from '@/components/ui/input';
import { css } from '@/styled-system/css';
import type {
  IndividualConsultationFormType,
  Participant,
} from '@/types/individualConsultation';
import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

interface ParticipantsTabsProps {
  individualConsultation: IndividualConsultationFormType;
  participants: Participant[];
  sortOrder: 'asc' | 'desc';
  setSortOrder: (val: 'asc' | 'desc') => void;
  searchInput: string;
  setSearchInput: (val: string) => void;
  executeSearch: () => void;
}

export const ParticipantsTabs = ({
  individualConsultation,
  participants,
  sortOrder,
  setSortOrder,
  searchInput,
  setSearchInput,
  executeSearch,
}: ParticipantsTabsProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const handleExportSpreadsheet = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export-spreadsheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participants, individualConsultation }),
      });

      if (!response.ok) {
        throw new Error('スプレッドシートのエクスポートに失敗しました');
      }

      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error(error);
      alert('エクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenSpreadsheet = async () => {
    if (isOpening) return;
    setIsOpening(true);

    try {
      const response = await fetch('/api/open-spreadsheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultationId: individualConsultation.consultation_id,
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
        width: 'full',
      })}
    >
      <div
        className={css({
          display: 'flex',
          flexDirection: { base: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { base: 'stretch', md: 'center' },
          width: 'full',
          gap: '3',
        })}
      >
        {/* 左側: ソート + 検索 */}
        <div
          className={css({
            display: 'flex',
            gap: '3',
            flexDirection: { base: 'column', md: 'row' },
            alignItems: { base: 'stretch', md: 'center' },
          })}
        >
          <div
            className={css({ display: 'flex', gap: '2', alignItems: 'center' })}
          >
            <label
              htmlFor="sortOrder"
              className={css({ fontSize: 'sm', whiteSpace: 'nowrap' })}
            >
              申込順:
            </label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className={css({
                border: '1px solid #e2e8f0',
                borderRadius: 'md',
                px: '2',
                py: '2',
                fontSize: 'sm',
              })}
            >
              <option value="desc">降順（新しい順）</option>
              <option value="asc">昇順（古い順）</option>
            </select>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeSearch();
            }}
            className={css({
              display: 'flex',
              gap: '2',
              width: { base: 'full', md: 'auto' },
            })}
          >
            <div className={css({ position: 'relative', flex: 1 })}>
              <Input
                type="text"
                placeholder="メールアドレスで検索"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={css({
                  pr: '10',
                  pl: '3',
                  py: '2',
                  width: { base: 'full', md: '200px' },
                })}
              />
              <FaSearch
                className={css({
                  position: 'absolute',
                  right: '3',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'gray.400',
                })}
              />
            </div>
            <button
              type="submit"
              className={css({
                bg: 'blue.600',
                color: 'white',
                px: '4',
                py: '2',
                borderRadius: 'md',
                fontSize: 'sm',
                whiteSpace: 'nowrap',
                _hover: { bg: 'blue.700' },
                cursor: 'pointer',
              })}
            >
              検索
            </button>
          </form>
        </div>

        {/* 右側: アクションボタン */}
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
