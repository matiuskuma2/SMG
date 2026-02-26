import React from 'react'
import { css } from '@/styled-system/css'
import { flex } from '@/styled-system/patterns'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  onClick?: () => void
  showText?: boolean
  className?: string
  size?: number
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  onClick, 
  showText = false, 
  className,
  size = 24 
}) => {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.back()
    }
  }

  const buttonClasses = flex({
    alignItems: 'center',
    color: 'primary',
    _hover: { color: 'blue.800' },
    mb: { base: '4', md: '6' },
    cursor: 'pointer'
  })

  return (
    <button
      onClick={handleClick}
      className={`${buttonClasses} ${className || ''}`}
    >
      <ArrowLeft size={size} className={css({ mr: showText ? '1' : '0' })} />
      {showText && '戻る'}
    </button>
  )
} 