import React from 'react'
import { css } from '@/styled-system/css'
import { Avatar } from '@/components/ui/Avatar'
import { RichContentDisplay } from '@/features/editer/RichContentDisplay'
import { Question, QuestionUser } from './types'

interface QuestionDetailProps {
  question: Question
  user: QuestionUser | null
  currentUserId?: string // ログイン中のユーザーID
}

export const QuestionDetail: React.FC<QuestionDetailProps> = ({ question, user, currentUserId }) => {
  // 論理削除された質問の場合
  if (question.deleted_at) {
    return (
      <div className={css({ 
        bg: 'white', 
        rounded: 'lg', 
        shadow: 'md',
        p: '6',
        textAlign: 'center',
        color: 'gray.500'
      })}>
        この質問は削除されました
      </div>
    )
  }
  
  // ログインユーザーが質問作成者でない、かつ質問が匿名または非表示の場合
  if ((question.is_anonymous || question.is_hidden) && currentUserId !== question.user_id) {
    return (
      <div className={css({ 
        bg: 'white', 
        rounded: 'lg', 
        shadow: 'md',
        p: '6',
        textAlign: 'center',
        color: 'gray.500'
      })}>
        この質問は見れません
      </div>
    )
  }

  return (
    <div className={css({ 
      bg: 'white', 
      rounded: 'lg', 
      shadow: 'md',
      mb: '6',
      overflow: 'hidden'
    })}>
      <div className={css({
        borderBottom: '1px solid',
        borderColor: 'gray.200',
        p: '4',
        display: 'flex',
        alignItems: 'center',
        gap: '3'
      })}>
        <div className={css({ flexShrink: 0 })}>
          <Avatar size="md" src={user?.icon || undefined} />
        </div>
        <div>
          <div className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
            {user?.username || 'ユーザー'}
          </div>
          <div className={css({ fontSize: 'xs', color: 'gray.500' })}>
            {question.updated_at ? new Date(question.updated_at).toLocaleString('ja-JP') : '日時不明'}
          </div>
        </div>
      </div>
      
      <div className={css({ p: '4' })}>
        <div className={css({ 
          fontSize: 'sm', 
          mb: '4'
        })}>
          <RichContentDisplay content={question.content} isHtml={true} />
        </div>
      </div>
    </div>
  )
} 