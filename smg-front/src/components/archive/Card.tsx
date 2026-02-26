import React from 'react'
import { Box } from '../../../styled-system/jsx'

// シンプルなカードコンポーネント
export const Card = ({ className, children }: { className?: string, children: React.ReactNode }) => {
  return (
    <Box
      className={className}
      bg="white"
      boxShadow="md"
      borderRadius="lg"
      overflow="hidden"
    >
      {children}
    </Box>
  )
}

export const CardContent = ({ className, children }: { className?: string, children: React.ReactNode }) => {
  return (
    <Box
      className={className}
      p={{ base: "3", md: "4" }}
    >
      {children}
    </Box>
  )
} 