import { Button } from '@/components/ui/button';
import { css, cx } from '@/styled-system/css';
import type { IndividualConsultationType } from '@/types/individualConsultation';
import type React from 'react';
import { FaPen, FaTrash, FaUsers } from 'react-icons/fa6';

interface IndividualConsultationListTableProps {
  individualConsultations: IndividualConsultationType[];
  handleViewParticipants: (individualConsultationId: string) => void;
  handleEdit: (individualConsultationId: string) => void;
  handleDelete: (individualConsultationId: string) => void;
}

// 日付をフォーマットする関数
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const IndividualConsultationListTable: React.FC<
  IndividualConsultationListTableProps
> = ({
  individualConsultations,
  handleViewParticipants,
  handleEdit,
  handleDelete,
}) => {
  return (
    <div
      className={css({
        display: { base: 'none', xl: 'block' },
        overflowX: 'auto',
      })}
    >
      <table
        className={css({
          w: 'full',
          borderCollapse: 'collapse',
          textAlign: 'left',
        })}
      >
        <thead>
          <tr
            className={css({
              bg: 'gray.50',
              borderBottom: '2px solid',
              borderColor: 'gray.200',
            })}
          >
            <th className={headerCellStyle}>サムネイル</th>
            <th className={headerCellStyle}>タイトル</th>
            <th className={headerCellStyle}>説明文</th>
            <th className={headerCellStyle}>講師名</th>
            <th className={headerCellStyle}>ステータス</th>
            <th className={headerCellStyle}>申込期限</th>
            <th className={headerCellStyle}>申込人数</th>
            <th className={headerCellStyle}>アクション</th>
          </tr>
        </thead>
        <tbody>
          {individualConsultations.map((item) => {
            const isExpired =
              new Date(item.application_end_datetime) < new Date();
            return (
              <tr
                key={item.consultation_id}
                className={cx(
                  css({
                    borderBottom: '1px solid',
                    borderColor: 'gray.200',
                    _hover: { bg: isExpired ? undefined : 'gray.100' },
                    transition: 'background-color 0.2s',
                  }),
                  isExpired &&
                    css({
                      bg: 'gray.100',
                      color: 'gray.500',
                    }),
                )}
              >
                <td className={cellStyle}>
                  <img
                    src={item.image_url ?? ''}
                    alt="サムネイル"
                    className={css({ w: '100px', h: '80px' })}
                  />
                </td>
                <td className={ellipsisText}>{item.title}</td>
                <td className={ellipsisText}>{item.description}</td>
                <td className={cellStyle}>{item.instructorName}</td>
                <td className={css({ py: '3', px: '4', textAlign: 'center' })}>
                  {item.is_draft ? (
                    <span
                      className={css({
                        color: 'gray.500',
                        fontStyle: 'italic',
                        fontWeight: 'medium',
                      })}
                    >
                      下書き
                    </span>
                  ) : (
                    <span
                      className={css({
                        color: 'green.600',
                        fontWeight: 'medium',
                      })}
                    >
                      公開
                    </span>
                  )}
                </td>
                <td className={cellStyle}>
                  {formatDate(item.application_start_datetime)} ~{' '}
                  {formatDate(item.application_end_datetime)}
                </td>
                <td className={cellStyle}>{item.applicants} 人</td>
                <td className={cellStyle}>
                  <div className={css({ display: 'flex', gap: '2' })}>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label="参加者一覧"
                      className={cx(
                        iconButtonStyle,
                        css({
                          bg: 'green.400',
                          borderColor: 'green.600',
                          _hover: { bg: 'green.700' },
                        }),
                      )}
                      onClick={() =>
                        handleViewParticipants(item.consultation_id)
                      }
                    >
                      <FaUsers size={24} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label="編集する"
                      className={cx(
                        iconButtonStyle,
                        css({
                          bg: 'blue.400',
                          borderColor: 'blue.600',
                          _hover: { bg: 'blue.700' },
                        }),
                      )}
                      onClick={() => handleEdit(item.consultation_id)}
                    >
                      <FaPen size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label="削除する"
                      className={cx(
                        iconButtonStyle,
                        css({
                          bg: 'red.400',
                          borderColor: 'red.600',
                          _hover: { bg: 'red.700' },
                        }),
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.consultation_id);
                      }}
                    >
                      <FaTrash size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// 共通スタイル定義
const headerCellStyle = css({
  py: '3',
  px: '4',
  fontWeight: 'semibold',
  color: 'gray.700',
  minW: '120px',
});

const ellipsisText = css({
  py: '3',
  px: '4',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxW: '250px',
});

const cellStyle = css({ py: '3', px: '4' });
const iconButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: '2',
  py: '2',
  borderRadius: 'md',
  cursor: 'pointer',
  width: '32px',
  height: '32px',
  color: 'white',
  _hover: { color: 'white' },
});
