import React, { useEffect, useState } from 'react'
import { css } from '@/styled-system/css'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { BackButton } from '@/components/ui/BackButton'
import { Question, Answer, QuestionUser } from './types'
import { QuestionDetail } from './QuestionDetail'
import { AnswerItem } from './AnswerItem'
import { useIsInstructor } from '@/hooks/useIsInstructor'

interface QuestionDetailContainerProps {
  questionId: string
}

export const QuestionDetailContainer: React.FC<QuestionDetailContainerProps> = ({ questionId }) => {
  const { isInstructor, loading: isInstructorLoading } = useIsInstructor()
  const [question, setQuestion] = useState<Question | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [user, setUser] = useState<QuestionUser | null>(null)
  const [instructors, setInstructors] = useState<Record<string, QuestionUser>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)

  const handleEdit = () => {
    const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://smg-dashboard.vercel.app'
    window.open(`${dashboardUrl}/questionlist/${questionId}`, '_blank')
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()
        
        // 現在ログイン中のユーザー情報を取得
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          setCurrentUserId(authUser.id)
        }
        
        // 質問データを取得
        const { data: questionData, error: questionError } = await supabase
          .from('trn_question')
          .select(`
            *,
            mst_user!trn_question_user_id_fkey (
              user_id,
              username,
              user_name_kana,
              icon,
              email,
              user_type
            )
          `)
          .eq('question_id', questionId)
          .is('deleted_at', null)
          .single()
          
        if (questionError) throw questionError
        if (!questionData) return notFound()
        
        setQuestion(questionData)
        
        // ユーザーデータを取得
        if (questionData.mst_user) {
          const userData = questionData.mst_user
          setUser({
            user_id: userData.user_id,
            username: userData.username,
            nickname: userData.user_name_kana,
            icon: userData.icon,
            email: userData.email || '',
            user_type: userData.user_type
          })
        }
        
        // 回答を取得
        const { data: answerData, error: answerError } = await supabase
          .from('trn_answer')
          .select('*')
          .eq('question_id', questionId)
          .eq('is_draft', false)
          .is('deleted_at', null)
          .order('created_at', { ascending: true })
          
        if (answerError) throw answerError
        
        setAnswers(answerData || [])
        
        // 回答に関連する講師データを取得
        if (answerData && answerData.length > 0) {
          // 講師IDの一覧を取得
          const instructorIds = [...new Set(answerData.map(a => a.instructor_id))]
          
          if (instructorIds.length > 0) {
            // 講師データを取得
            const { data: instructorData, error: instructorError } = await supabase
              .from('mst_user')
              .select('user_id, username, user_name_kana, icon, email, user_type')
              .in('user_id', instructorIds)
              .is('deleted_at', null)

            if (instructorError) {
              throw instructorError
            } else if (instructorData) {
              // 講師データをIDをキーにしたオブジェクトに変換
              const instructorMap: Record<string, QuestionUser> = {}
              instructorData.forEach(instructor => {
                instructorMap[instructor.user_id] = {
                  user_id: instructor.user_id,
                  username: instructor.username,
                  nickname: instructor.user_name_kana,
                  icon: instructor.icon,
                  email: instructor.email || '',
                  user_type: instructor.user_type
                }
              })
              setInstructors(instructorMap)
            }
          }
        }
        
        setLoading(false)
      } catch (err) {
        console.error('データの取得に失敗しました:', err)
        setError('データの取得に失敗しました')
        setLoading(false)
      }
    }
    
    fetchData()
  }, [questionId])
  
  if (loading) {
    return <div className={css({ p: '8', textAlign: 'center' })}>読み込み中...</div>
  }
  
  if (error) {
    return <div className={css({ p: '8', textAlign: 'center', color: 'red.500' })}>{error}</div>
  }
  
  if (!question) {
    return notFound()
  }

  return (
    <div className={css({ maxW: '4xl', mx: 'auto', py: '8', px: { base: '4', md: '6' } })}>
      {/* 戻るボタン */}
      <BackButton />

      {/* 質問セクション */}
      <QuestionDetail question={question} user={user} currentUserId={currentUserId} />
      
      {/* 回答セクション */}
      <div>
        <div className={css({
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: '4',
          pl: '2'
        })}>
          <h2 className={css({
            fontSize: 'xl',
            fontWeight: 'bold'
          })}>
            回答
          </h2>
          {!isInstructorLoading && isInstructor && (
            <button
              onClick={handleEdit}
              className={css({
                px: '4',
                py: '2',
                bg: 'blue.600',
                color: 'white',
                borderRadius: 'md',
                fontSize: 'sm',
                fontWeight: 'medium',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: {
                  bg: 'blue.700',
                },
                _active: {
                  transform: 'scale(0.98)',
                },
              })}
            >
              編集
            </button>
          )}
        </div>

        <AnswerItem
          answers={answers}
          instructors={instructors}
          question={question}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  )
} 