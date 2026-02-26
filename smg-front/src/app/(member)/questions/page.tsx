import { QuestionsPublicPage } from '@/components/questions/QuestionsPage'
import { css } from '@/styled-system/css'
import Banner from '@/components/events/Banner'

export default function Page() {
  return (
    <div className={css({
      maxW: '7xl',
      mx: 'auto',
      px: '4',
      '@media (min-width: 768px)': { px: '8' },
    })}>
      <Banner />
      <QuestionsPublicPage />
    </div>
  )
}