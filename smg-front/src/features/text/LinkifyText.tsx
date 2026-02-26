import React from 'react'
import { css } from '@/styled-system/css'

interface LinkifyTextProps {
  children: string
}

export const LinkifyText: React.FC<LinkifyTextProps> = ({ children }) => {
  // URLパターンを検出する正規表現
  const urlRegex = /(https?:\/\/[^\s<>"]+)/gi
  
  // テキストをURLでスプリットし、URLをリンクに変換
  const parts = children.split(urlRegex)
  
  return (
    <>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className={css({
                color: 'blue.600',
                textDecoration: 'underline',
                _hover: {
                  color: 'blue.800',
                  textDecoration: 'none',
                },
                wordBreak: 'break-all',
              })}
            >
              {part}
            </a>
          )
        }
        return part
      })}
    </>
  )
}