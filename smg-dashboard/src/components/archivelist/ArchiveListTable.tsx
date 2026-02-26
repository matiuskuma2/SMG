import { ActionButtons } from '@/components/ui/ActionIconButton';
import type { Archive } from '@/lib/api/archive';
import { css } from '@/styled-system/css';
import { formatIsoDate } from '@/utils/date';
import type React from 'react';
import { FaFile, FaVideo } from 'react-icons/fa6';

interface ArchiveListTableProps {
  archives: Archive[];
  handleEdit: (archiveId: string) => void;
  handleDelete: (archiveId: string) => void;
}

export const ArchiveListTable: React.FC<ArchiveListTableProps> = ({
  archives,
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
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                minW: '200px',
              })}
            >
              アーカイブタイトル
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                minW: '180px',
              })}
            >
              紐づきイベント
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                minW: '120px',
              })}
            >
              区分・タイプ
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                textAlign: 'center',
                minW: '80px',
              })}
            >
              資料
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                textAlign: 'center',
                minW: '80px',
              })}
            >
              動画
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                minW: '120px',
              })}
            >
              投稿開始日
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                minW: '120px',
              })}
            >
              投稿終了日
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                minW: '120px',
              })}
            >
              作成日
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                textAlign: 'center',
                minW: '100px',
              })}
            >
              ステータス
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'semibold',
                color: 'gray.700',
                minW: '150px',
              })}
            >
              アクション
            </th>
          </tr>
        </thead>
        <tbody>
          {archives.map((archive) => (
            <tr
              key={archive.archive_id}
              className={css({
                borderBottom: '1px solid',
                borderColor: 'gray.200',
                _hover: { bg: 'gray.50' },
              })}
            >
              <td className={css({ py: '3', px: '4', fontWeight: 'medium' })}>
                {archive.title}
              </td>
              <td className={css({ py: '3', px: '4' })}>
                {archive.event_name || (
                  <span
                    className={css({ color: 'gray.400', fontStyle: 'italic' })}
                  >
                    なし
                  </span>
                )}
              </td>
              <td className={css({ py: '3', px: '4' })}>
                {(archive.event_type_name === '5大都市グループ相談会&交流会'
                  ? 'グループ相談会'
                  : archive.event_type_name) ||
                  archive.archive_type_name ||
                  '未設定'}
              </td>
              <td className={css({ py: '3', px: '4', textAlign: 'center' })}>
                <div
                  className={css({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1',
                  })}
                >
                  <FaFile className={css({ color: 'blue.500' })} />
                  <span>{archive.file_count || 0}</span>
                </div>
              </td>
              <td className={css({ py: '3', px: '4', textAlign: 'center' })}>
                <div
                  className={css({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1',
                  })}
                >
                  <FaVideo className={css({ color: 'red.500' })} />
                  <span>{archive.video_count || 0}</span>
                </div>
              </td>
              <td className={css({ py: '3', px: '4' })}>
                {archive.publish_start_at
                  ? formatIsoDate(archive.publish_start_at)
                  : '未設定'}
              </td>
              <td className={css({ py: '3', px: '4' })}>
                {archive.publish_end_at
                  ? formatIsoDate(archive.publish_end_at)
                  : '未設定'}
              </td>
              <td className={css({ py: '3', px: '4' })}>
                {archive.created_at
                  ? formatIsoDate(archive.created_at)
                  : '未設定'}
              </td>
              <td className={css({ py: '3', px: '4', textAlign: 'center' })}>
                {archive.is_draft ? (
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
              <td className={css({ py: '3', px: '4' })}>
                <div className={css({ display: 'flex', gap: '2' })}>
                  <ActionButtons
                    targetId={archive.archive_id}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
