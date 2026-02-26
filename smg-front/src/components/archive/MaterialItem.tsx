import React, { useState } from 'react'
import { Box, Flex } from '../../../styled-system/jsx'
import { FileText, Download, Loader2 } from 'lucide-react'
import { css } from '../../../styled-system/css'

interface MaterialItemProps {
  material: {
    id: string;
    fileUrl: string;
    title: string;
    fileSize?: string;
    description?: string;
  }
}

export const MaterialItem = ({ material }: MaterialItemProps) => {
  const [isDownloading, setIsDownloading] = useState(false)

  return (
    <Flex
      key={material.id}
      alignItems="center"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      p={{ base: "2", md: "3" }}
      cursor={isDownloading ? 'not-allowed' : 'pointer'}
      _hover={{ bg: isDownloading ? 'transparent' : 'gray.50' }}
      onClick={async () => {
        if (isDownloading) return;
        if (material.fileUrl && material.fileUrl !== '#') {
          setIsDownloading(true)
          try {
            const response = await fetch(material.fileUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', material.title);
            link.setAttribute('target', '_blank');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          } catch (error) {
            console.error('ファイルのダウンロードに失敗しました:', error);
          } finally {
            setIsDownloading(false)
          }
        }
      }}
    >
      <FileText className={css({ mr: '2', color: 'gray.500', fontSize: { base: '16px', md: '18px' } })} />
      <Box flex="1">
        <Box fontSize={{ base: "xs", md: "sm" }}>{material.title}</Box>
        {material.description && (
          <Box fontSize={{ base: "2xs", md: "xs" }} color="gray.600" mt="1">{material.description}</Box>
        )}
      </Box>
      {material.fileSize && (
        <Box fontSize={{ base: "2xs", md: "xs" }} color="gray.500" mr="2">{material.fileSize}</Box>
      )}
      <Box
        p="1"
        borderRadius="full"
        opacity={isDownloading ? 0.5 : 1}
      >
        {isDownloading ? (
          <Loader2 size={16} className={css({ animation: 'spin 1s linear infinite' })} />
        ) : (
          <Download size={16} />
        )}
      </Box>
    </Flex>
  )
} 