import React from 'react'
import { css } from '@/styled-system/css'
import { Avatar } from '@/components/ui/Avatar'
import { RichContentDisplay } from '@/features/editer/RichContentDisplay'
import { Answer, QuestionUser } from './types'

interface AnswerItemProps {
  answers: Answer[]
  instructors: Record<string, QuestionUser>
  question: {
    user_id: string
    is_anonymous: boolean | null
    is_hidden: boolean | null
    deleted_at: string | null
  }
  currentUserId?: string
}

export const AnswerItem: React.FC<AnswerItemProps> = ({ answers, instructors, question, currentUserId }) => {
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
        この回答は見れません
      </div>
    )
  }
  
  if (answers.length === 0) {
    return (
      <div className={css({ 
        bg: 'white', 
        rounded: 'lg', 
        shadow: 'md',
        p: '6',
        textAlign: 'center',
        color: 'gray.500'
      })}>
        まだ回答がありません
      </div>
    )
  }
  
  return (
    <div className={css({ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '2' 
    })}>
      {answers.map(answer => {
        const instructor = instructors[answer.instructor_id]
        
        return (
          <div 
            key={answer.answer_id} 
            className={css({ 
              bg: 'white', 
              rounded: 'lg', 
              shadow: 'md',
              overflow: 'hidden'
            })}
          >
            <div className={css({
              borderBottom: '1px solid',
              borderColor: 'gray.200',
              p: '2',
              display: 'flex',
              alignItems: 'center',
              gap: '3'
            })}>
              <div className={css({ flexShrink: 0 })}>
                <Avatar size="md" src={instructor?.icon || undefined} />
              </div>
              <div>
                <div className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                  {instructor ? (instructor.username || '講師') : '講師'}
                </div>
                <div className={css({ fontSize: 'xs', color: 'gray.500' })}>
                  {answer.updated_at ? new Date(answer.updated_at).toLocaleString('ja-JP') : '日時不明'}
                </div>
              </div>
            </div>
            
            <div className={css({ p: '4' })}>
              <div className={css({ fontSize: 'sm' })}>
                <RichContentDisplay content={answer.content} isHtml={true} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
} 