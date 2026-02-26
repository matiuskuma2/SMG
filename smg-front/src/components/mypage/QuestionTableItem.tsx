import { css } from '@/styled-system/css'
import { QuestionHistoryItem } from './types'
import { stripHtmlTags } from '@/lib/utils/html'

interface QuestionTableItemProps {
  item: QuestionHistoryItem;
  truncateText: (text: string, limit?: number) => string;
  handleViewDetails: (id: string) => void;
  handleEditQuestion: (id: string) => void;
  openDeleteModal: (id: string, title: string) => void;
}

export const QuestionTableItem = ({
  item,
  truncateText,
  handleViewDetails,
  handleEditQuestion,
  openDeleteModal
}: QuestionTableItemProps) => {
  return (
    <tr className={css({
      borderBottomWidth: '1px',
      borderColor: 'gray.200',
      _hover: { bg: 'gray.50' }
    })}>
      <td className={css({ py: '3', px: '2' })}>{truncateText(item.question, 20)}</td>
      <td className={css({ py: '3', px: '2' })}>{truncateText(item.answer, 20)}</td>
      <td className={css({ py: '3', px: '2' })}>
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
      </td>
      <td className={css({ py: '3', px: '2' })}>
        <div className={css({ display: 'flex', gap: '2' })}>
          <button
            onClick={() => handleViewDetails(item.id)}
            className={css({
              bg: 'blue.500',
              color: 'white',
              px: '3',
              py: '1',
              rounded: 'md',
              fontSize: 'sm',
              fontWeight: 'medium',
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
              px: '3',
              py: '1',
              rounded: 'md',
              fontSize: 'sm',
              fontWeight: 'medium',
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
              px: '3',
              py: '1',
              rounded: 'md',
              fontSize: 'sm',
              fontWeight: 'medium',
              _hover: { bg: 'red.600' },
              cursor: 'pointer',
            })}
          >
            削除
          </button>
        </div>
      </td>
    </tr>
  )
} 