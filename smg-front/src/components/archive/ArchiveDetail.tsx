import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { css } from '../../../styled-system/css'
import { Box, Flex, Stack, } from '../../../styled-system/jsx'
import { getEventFiles } from '../../lib/api/archive'
import { Card, CardContent } from './Card'
import { MaterialItem } from './MaterialItem'
import { ArchiveData, EventFile } from './types'
import { LinkifyText } from '../../features/text/LinkifyText'
import { useIsInstructor } from '../../hooks/useIsInstructor'

interface ArchiveDetailProps {
  archiveData: ArchiveData
  showEditButton?: boolean
}

export const ArchiveDetail = ({ archiveData, showEditButton = true }: ArchiveDetailProps) => {
  const router = useRouter()
  const [eventFiles, setEventFiles] = useState<EventFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { isInstructor, loading: isInstructorLoading } = useIsInstructor()

  // 編集ボタンのハンドラー
  const handleEdit = () => {
    const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://smg-dashboard.vercel.app'

    // 写真またはニュースレターの場合は専用のページにリダイレクト
    if (archiveData.archiveType === 'photos' || archiveData.archiveType === 'newsletter') {
      window.open(`${dashboardUrl}/archive/edit/${archiveData.id}`, '_blank')
    } else {
      // その他のアーカイブはeventIdを含むURLにリダイレクト
      if (archiveData.eventId) {
        window.open(`${dashboardUrl}/event/archive/${archiveData.eventId}?archiveId=${archiveData.id}`, '_blank')
      }
    }
  }

  // イベントファイルを取得（eventIdがある場合のみ）
  useEffect(() => {
    const fetchEventFiles = async () => {
      if (!archiveData.eventId) return

      setIsLoading(true)
      try {
        const data = await getEventFiles(archiveData.eventId)
        setEventFiles(data)
        console.log('取得したイベントファイル:', data)
      } catch (error) {
        console.error('イベントファイルの取得エラー:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventFiles()
  }, [archiveData.eventId])

  return (
    <Card className={css({ mb: '6' })}>
      <Box mt="6"></Box>
      <Flex
        position="relative"
        px={{ base: "4", md: "6" }}
        mb="4"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box
          onClick={() => router.back()}
          display="flex"
          alignItems="center"
          justifyContent="center"
          width="40px"
          height="40px"
          cursor="pointer"
          role="button"
          aria-label="戻る"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z"
              fill="currentColor"
            />
          </svg>
        </Box>
        {showEditButton && !isInstructorLoading && isInstructor && (
          <Box
            onClick={handleEdit}
            px="4"
            py="2"
            bg="blue.600"
            color="white"
            borderRadius="md"
            fontSize="sm"
            fontWeight="medium"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ bg: 'blue.700' }}
            _active={{ transform: 'scale(0.98)' }}
          >
            編集
          </Box>
        )}
      </Flex>

      <Box fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" mb="4" px={{ base: "4", md: "6" }}>{archiveData.title}</Box>
      <Box px={{ base: "4", md: "6" }} fontSize={{ base: "sm", md: "md" }} color="gray.700" mb="4" whiteSpace="pre-line">
        <LinkifyText>{archiveData.description || ''}</LinkifyText>
      </Box>

      <CardContent className={css({ p: { base: '4', md: '6' } })}>
        {/* 動画が存在する場合に表示 */}
        {archiveData.videos.length > 0 && (
          <Box mb="6">
            <Box fontSize={{ base: "md", md: "lg" }} fontWeight="bold" mb="2">動画</Box>
            <Stack direction="column" gap="6">
              {archiveData.videos.map((video, index) => (
                <Box key={video.id}>
                  {/* 動画番号ラベル */}
                  <Box fontSize={{ base: "sm", md: "md" }} fontWeight="bold" mb="2">{`動画${index + 1}`}</Box>
                  {/* 動画プレーヤー */}
                  <Box width="100%" position="relative" paddingBottom="56.25%">
                    <iframe
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%"
                      }}
                      src={video.videoUrl.replace(/https:\/\/vimeo\.com\/(\d+)(?:\/([a-zA-Z0-9]+))?.*/, 'https://player.vimeo.com/video/$1?h=$2&autoplay=0&title=0&byline=0&portrait=0&controls=1&loop=0&muted=0&show_title=0')}
                      title={`動画${index + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* イベントファイルがある場合は表示 */}
        {isLoading ? (
          <Box mb="6" color="gray.500" fontSize="sm">イベント資料を読み込み中...</Box>
        ) : eventFiles.length > 0 ? (
          <Box mb="6">
            <Box fontSize={{ base: "md", md: "lg" }} fontWeight="bold" mb="2">イベント資料</Box>
            <Stack direction="column" gap="2">
              {eventFiles.map((file) => (
                <MaterialItem key={file.file_id} material={{
                  id: file.file_id,
                  fileUrl: file.file_url,
                  title: file.file_name || `資料 ${file.display_order}`,
                  description: file.file_description || undefined
                }} />
              ))}
            </Stack>
          </Box>
        ) : null}

        {/* アーカイブファイルがある場合は表示 */}
        {archiveData.files.length > 0 ? (
          <Box mb="6">
            <Box fontSize={{ base: "md", md: "lg" }} fontWeight="bold" mb="2">アーカイブ資料</Box>
            <Stack direction="column" gap="2">
              {archiveData.files.map((file) => (
                <MaterialItem key={file.id} material={{
                  id: file.id,
                  fileUrl: file.fileUrl,
                  title: file.fileName || `資料 ${file.displayOrder}`
                }} />
              ))}
            </Stack>
          </Box>
        ) : (
          <Box mb="6" color="gray.500" fontSize="sm">アーカイブ資料はありません</Box>
        )}
      </CardContent>
    </Card>
  )
}