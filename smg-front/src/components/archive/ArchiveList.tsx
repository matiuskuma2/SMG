import { css } from '@/styled-system/css'
import ArchiveCard from './ArchiveCard'
import { ListPagination } from '@/components/ui/ListPagination'
import { Archive } from './types'

type ArchiveListProps = {
  archives: Archive[]
  currentPage: number
  totalPages: number
  basePath: string
  onPageChange: (page: number) => void
  loading: boolean
  isOthers?: boolean
}

export default function ArchiveList({
  archives,
  currentPage,
  totalPages,
  basePath,
  onPageChange,
  loading,
  isOthers = false
}: ArchiveListProps) {
  // useArchivesフックで既にアクセス権チェックが完了しているため、
  // ここでの重複チェックは不要。直接archivesを使用する。

  if (loading) {
    return (
      <div className={css({ textAlign: 'center', py: '8', color: 'gray.500' })}>
        読み込み中...
      </div>
    )
  }

  return (
    <>
      <div className={css({ mt: '6' })}>
        {archives.length > 0 ? (
          archives.map((archive) => (
            <ArchiveCard key={archive.archive_id} archive={archive} isOthers={isOthers} />
          ))
        ) : (
          <div className={css({ textAlign: 'center', py: '8', color: 'gray.500' })}>
            該当するアーカイブがありません
          </div>
        )}
      </div>
      
      {/* ページネーション */}
      {totalPages > 1 && (
        <ListPagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath={basePath}
          onPageChange={onPageChange}
        />
      )}
    </>
  )
} 