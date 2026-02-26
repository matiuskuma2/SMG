import { ActionButtons } from '@/components/ui/ActionIconButton';
import type { Archive } from '@/lib/api/archive';
import { css } from '@/styled-system/css';
import { formatIsoDate } from '@/utils/date';
import type React from 'react';
import { FaFile, FaVideo } from 'react-icons/fa6';

interface ArchiveListCardsProps {
  archives: Archive[];
  handleEdit: (archiveId: string) => void;
  handleDelete: (archiveId: string) => void;
}

export const ArchiveListCards: React.FC<ArchiveListCardsProps> = ({
  archives,
  handleEdit,
  handleDelete,
}) => {
  return (
    <div
      className={css({
        display: { base: 'block', xl: 'none' },
      })}
    >
      {archives.map((archive) => (
        <div
          key={archive.archive_id}
          className={css({
            borderBottom: '1px solid',
            borderColor: 'gray.200',
            p: '4',
          })}
        >
          <div
            className={css({
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: '3',
            })}
          >
            <div className={css({ flex: 1 })}>
              <div className={css({ fontWeight: 'bold', mb: 1 })}>
                {archive.title}
              </div>
              <div className={css({ color: 'gray.600', fontSize: 'sm' })}>
                {(archive.event_type_name === '5大都市グループ相談会&交流会'
                  ? 'グループ相談会'
                  : archive.event_type_name) ||
                  archive.archive_type_name ||
                  '未設定'}
              </div>
            </div>
          </div>

          <div className={css({})}>
            <div
              className={css({
                display: 'grid',
                gridTemplateColumns: '100px 1fr',
                gap: '1',
                mb: '1',
              })}
            >
              <div className={css({ color: 'gray.600', fontSize: 'sm' })}>
                紐づきイベント:
              </div>
              <div className={css({ fontSize: 'sm' })}>
                {archive.event_name || (
                  <span
                    className={css({ color: 'gray.400', fontStyle: 'italic' })}
                  >
                    なし
                  </span>
                )}
              </div>
            </div>
            <div
              className={css({
                display: 'grid',
                gridTemplateColumns: '100px 1fr',
                gap: '1',
                mb: '1',
              })}
            >
              <div className={css({ color: 'gray.600', fontSize: 'sm' })}>
                資料数:
              </div>
              <div
                className={css({
                  fontSize: 'sm',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1',
                })}
              >
                <FaFile className={css({ color: 'blue.500' })} />
                <span>{archive.file_count || 0}件</span>
              </div>
            </div>
            <div
              className={css({
                display: 'grid',
                gridTemplateColumns: '100px 1fr',
                gap: '1',
                mb: '1',
              })}
            >
              <div className={css({ color: 'gray.600', fontSize: 'sm' })}>
                動画数:
              </div>
              <div
                className={css({
                  fontSize: 'sm',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1',
                })}
              >
                <FaVideo className={css({ color: 'red.500' })} />
                <span>{archive.video_count || 0}件</span>
              </div>
            </div>
            <div
              className={css({
                display: 'grid',
                gridTemplateColumns: '100px 1fr',
                gap: '1',
                mb: '1',
              })}
            >
              <div className={css({ color: 'gray.600', fontSize: 'sm' })}>
                投稿開始日:
              </div>
              <div className={css({ fontSize: 'sm' })}>
                {archive.publish_start_at
                  ? formatIsoDate(archive.publish_start_at)
                  : '未設定'}
              </div>
            </div>
            <div
              className={css({
                display: 'grid',
                gridTemplateColumns: '100px 1fr',
                gap: '1',
                mb: '1',
              })}
            >
              <div className={css({ color: 'gray.600', fontSize: 'sm' })}>
                投稿終了日:
              </div>
              <div className={css({ fontSize: 'sm' })}>
                {archive.publish_end_at
                  ? formatIsoDate(archive.publish_end_at)
                  : '未設定'}
              </div>
            </div>
          </div>
          <div
            className={css({
              display: 'flex',
              gap: '2',
              mt: '3',
              justifyContent: 'flex-end',
            })}
          >
            <ActionButtons
              targetId={archive.archive_id}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
