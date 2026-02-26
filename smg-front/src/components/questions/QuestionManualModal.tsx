'use client'

import { RichContentDisplay } from '@/features/editer/RichContentDisplay'
import { createClient } from '@/lib/supabase'
import { css } from '@/styled-system/css'
import React, { useEffect, useState } from 'react'
import { IoClose } from 'react-icons/io5'

interface QuestionManualModalProps {
  isOpen: boolean
  onClose: () => void
}

interface QuestionManual {
  question_manual_id: string
  description: string | null
}

export const QuestionManualModal: React.FC<QuestionManualModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [manual, setManual] = useState<QuestionManual | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const fetchManual = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        const { data, error } = await supabase
          .from('mst_question_manual')
          .select('question_manual_id, description')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error) throw error

        setManual(data)
      } catch (err) {
        console.error('質問マニュアルの取得に失敗しました:', err)
        setError('質問マニュアルの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchManual()
  }, [isOpen])

  // モーダルが開いている時はスクロールを無効化
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className={css({
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        p: '4',
      })}
      onClick={onClose}
    >
      <div
        className={css({
          bg: 'white',
          rounded: 'lg',
          shadow: 'xl',
          maxW: '2xl',
          w: 'full',
          maxH: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        })}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div
          className={css({
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: '4',
            borderBottom: '1px solid',
            borderColor: 'gray.200',
          })}
        >
          <h2 className={css({ fontSize: 'xl', fontWeight: 'bold' })}>
            質問ページの使い方
          </h2>
          <button
            onClick={onClose}
            className={css({
              p: '2',
              rounded: 'full',
              color: 'gray.500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              _hover: {
                bg: 'gray.100',
                color: 'gray.700',
              },
            })}
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* コンテンツ */}
        <div
          className={css({
            p: '4',
            overflowY: 'auto',
            flex: 1,
          })}
        >
          {loading ? (
            <div className={css({ textAlign: 'center', py: '8', color: 'gray.500' })}>
              読み込み中...
            </div>
          ) : error ? (
            <div className={css({ textAlign: 'center', py: '8', color: 'red.500' })}>
              {error}
            </div>
          ) : manual?.description ? (
            <RichContentDisplay content={manual.description} isHtml={true} />
          ) : (
            <div className={css({ textAlign: 'center', py: '8', color: 'gray.500' })}>
              マニュアルが登録されていません
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
