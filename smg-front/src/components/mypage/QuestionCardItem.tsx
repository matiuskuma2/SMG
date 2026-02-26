import { css } from '@/styled-system/css'
import { QuestionHistoryItem } from './types'
import { stripHtmlTags } from '@/lib/utils/html'

interface QuestionCardItemProps {
  item: QuestionHistoryItem;
  truncateText: (text: string, limit?: number) => string;
  handleViewDetails: (id: string) => void;
  handleEditQuestion: (id: string) => void;
  openDeleteModal: (id: string, title: string) => void;
}

export const QuestionCardItem = ({
  item,
  truncateText,
  handleViewDetails,
  handleEditQuestion,
  openDeleteModal
}: QuestionCardItemProps) => {
  return (
    <div className={css({
      borderWidth: '1px',
      borderColor: 'gray.200',
      borderRadius: 'md',
      p: '4',
      mb: '4',
      bg: 'white',
      boxShadow: 'sm',
    })}>
      <div className={css({ mb: '3' })}>
        <div className={css({ 
          fontWeight: 'medium', 
          fontSize: 'sm', 
          color: 'gray.600', 
          mb: '1' 
        })}>
          質問
        </div>
        <div className={css({ fontSize: 'md' })}>
          {truncateText(item.question, 30)}
        </div>
      </div>
      
      <div className={css({ mb: '3' })}>
        <div className={css({ 
          fontWeight: 'medium', 
          fontSize: 'sm', 
          color: 'gray.600', 
          mb: '1' 
        })}>
          回答
        </div>
        <div className={css({ fontSize: 'md' })}>
          {truncateText(item.answer, 30)}
        </div>
      </div>
      
      <div className={css({ mb: '3' })}>
        <span className={css({ 
          px: '2', 
          py: '1', 
          bg: item.isPublic ? 'green.100' : 'gray.100', 
          color: item.isPublic ? 'green.700' : 'gray.700', 
          fontSize: 'xs', 
          fontWeight: 'medium',
          rounded: 'sm',
          display: 'inline-block'
        })}>
          {item.isPublic ? '公開' : '非公開'}
        </span>
      </div>
      
      <div className={css({ 
        display: 'flex', 
        gap: '2',
        flexWrap: 'wrap', 
        justifyContent: 'center',
        mt: '3'
      })}>
        <button
          onClick={() => handleViewDetails(item.id)}
          className={css({
            bg: 'blue.500',
            color: 'white',
            px: '4',
            py: '2',
            rounded: 'md',
            fontSize: 'sm',
            fontWeight: 'medium',
            flex: '1',
            minWidth: '70px',
            textAlign: 'center',
            _hover: { bg: 'blue.600' },
            cursor: 'pointer',
          })}
        >
          詳細
        </button>
        <button
          onClick={() => handleEditQuestion(item.id)}
          className={css({
            bg: 'gray.200',
            color: 'gray.700',
            px: '4',
            py: '2',
            rounded: 'md',
            fontSize: 'sm',
            fontWeight: 'medium',
            flex: '1',
            minWidth: '70px',
            textAlign: 'center',
            _hover: { bg: 'gray.300' },
            cursor: 'pointer',
          })}
        >
          編集
        </button>
        <button
          onClick={() => openDeleteModal(item.id, stripHtmlTags(item.question))}
          className={css({
            bg: 'red.500',
            color: 'white',
            px: '4',
            py: '2',
            rounded: 'md',
            fontSize: 'sm',
            fontWeight: 'medium',
            flex: '1',
            minWidth: '70px',
            textAlign: 'center',
            _hover: { bg: 'red.600' },
            cursor: 'pointer',
          })}
        >
          削除
        </button>
      </div>
    </div>
  )
} 