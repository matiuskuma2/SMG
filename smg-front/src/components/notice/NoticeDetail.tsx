import React from 'react'
import { Box, Flex, Stack } from '@/styled-system/jsx'
import { css } from '@/styled-system/css'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { NoticeData } from './types'
import { AttachmentItem } from './AttachmentItem'
import { getCategoryColor } from './categoryColors'
import { RichContentDisplay } from '@/features/editer/RichContentDisplay';

interface NoticeDetailProps {
  noticeData: NoticeData
}

/**
 * 日付を日本時間でフォーマットする
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return '未設定';
  
  const date = new Date(dateString);
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const year = jstDate.getUTCFullYear();
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getUTCDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
}

export const NoticeDetail = ({ noticeData }: NoticeDetailProps) => {
  const router = useRouter()
  
  // Supabaseの日付フィールドを表示用にフォーマット
  const displayDate = noticeData.publish_start_at 
    ? formatDate(noticeData.publish_start_at)
    : formatDate(noticeData.created_at);
  
  // カテゴリの色を事前に計算
  const categoryColors = noticeData.mst_notice_category 
    ? getCategoryColor(noticeData.mst_notice_category.category_name) 
    : null;

  return (
    <Box
      bg="white"
      borderRadius="lg"
      boxShadow="md"
      overflow="hidden"
      className={css({ mb: '6' })}
    >
      <Box mt="6"></Box>
      <Flex
        position="relative"
        px={{ base: "4", md: "6" }}
        mb="4"
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
      </Flex>

      {/* プロフィール情報 */}
      <Flex 
        px={{ base: "4", md: "6" }}
        mb="6"
        alignItems="center"
      >
        <Box
          width="50px"
          height="50px"
          borderRadius="full"
          overflow="hidden"
          position="relative"
          mr="3"
        >
          <Image
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dXNlcnxlbnwwfHwwfHx8MA%3D%3D"
            alt="プロフィール画像"
            fill
            quality={100}
            unoptimized={true}
            style={{ objectFit: 'cover' }}
          />
        </Box>
        <Box>
          <Box fontSize="sm" fontWeight="medium">
            山田太郎
          </Box>
          <Box fontSize="xs" color="gray.500">
            作成日時: {displayDate}
          </Box>
        </Box>
      </Flex>

      <Box fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" mb="4" px={{ base: "4", md: "6" }}>
        {noticeData.title}
      </Box>
      
      {/* 日付とカテゴリーを横並び */}
      <Box 
        px={{ base: "4", md: "6" }} 
        mb="6"
        display="flex"
        alignItems="center"
        gap="3"
      >
        <Box fontSize="sm" color="gray.500">
          {displayDate}
        </Box>
        {noticeData.mst_notice_category && categoryColors && (
          <Box
            fontSize="xs"
            px="2"
            py="1"
            borderRadius="full"
            border="1px solid"
            style={{
              backgroundColor: categoryColors.bg,
              color: categoryColors.color,
              borderColor: categoryColors.borderColor,
            }}
          >
            {noticeData.mst_notice_category.category_name}
          </Box>
        )}
      </Box>

      <Box
        px={{ base: "4", md: "6" }}
        fontSize={{ base: "sm", md: "md" }}
        mb="6"
      >
        <RichContentDisplay content={noticeData.content} isHtml={true} />
      </Box>

      {noticeData.attachments && noticeData.attachments.length > 0 && (
        <Box px={{ base: "4", md: "6" }} pb="6">
          <Box fontSize={{ base: "md", md: "lg" }} fontWeight="bold" mb="2">添付資料</Box>
          <Stack direction="column" gap="2">
            {noticeData.attachments.map((attachment) => (
              <AttachmentItem key={attachment.id} attachment={attachment} />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  )
} 