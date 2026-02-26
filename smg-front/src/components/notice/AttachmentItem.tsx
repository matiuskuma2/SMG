import React from 'react'
import { Box, Flex } from '@/styled-system/jsx'
import Link from 'next/link'
import { NoticeAttachment } from './types'

interface AttachmentItemProps {
  attachment: NoticeAttachment
}

export const AttachmentItem = ({ attachment }: AttachmentItemProps) => {
  return (
    <Flex
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      p="3"
      alignItems="center"
      _hover={{ bg: 'gray.50' }}
    >
      <Box mr="3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#E2E8F0"/>
          <path d="M14 2V8H20L14 2Z" fill="#CBD5E0"/>
          <path d="M16 13H8V15H16V13Z" fill="#4A5568"/>
        </svg>
      </Box>
      <Box flex="1">
        <Box fontSize="sm" fontWeight="medium">{attachment.title}</Box>
        <Box fontSize="xs" color="gray.500">{attachment.fileSize}</Box>
      </Box>
      <Link
        href={attachment.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Box
          px="3"
          py="1"
          borderRadius="md"
          fontSize="xs"
          bg="blue.50"
          color="blue.600"
          _hover={{ bg: 'blue.100' }}
        >
          ダウンロード
        </Box>
      </Link>
    </Flex>
  )
} 