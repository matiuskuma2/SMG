import { css } from '@/styled-system/css'

type ArchiveTabsProps = {
  tabId: string
  handleTabChange: (tab: string) => void
}

export default function ArchiveTabs({ tabId, handleTabChange }: ArchiveTabsProps) {
  const getActiveTabName = () => {
    switch(tabId) {
      case 'regular':
        return '定例会'
      case 'bookkeeping':
        return '簿記講座'
      case 'online-seminar':
        return 'オンラインセミナー'
      case 'special-seminar':
        return '特別セミナー'
      case 'photos':
        return '写真'
      case 'newsletter':
        return 'ニュースレター'
      case 'sawabe-instructor':
        return '沢辺講師'
      case 'five-cities':
        return 'グループ相談会'
      default:
        return '定例会'
    }
  }

  const tabs = ['定例会', '簿記講座', 'グループ相談会', 'オンラインセミナー', '特別セミナー', '写真', 'ニュースレター', '沢辺講師']

  return (
    <div className={css({ 
      display: 'flex',
      width: '100%',
      flexWrap: 'nowrap',
      overflowX: 'auto',
      gap: { base: '0', md: '2' },
      scrollbarWidth: 'none',
      '&::-webkit-scrollbar': {
        display: 'none'
      }
    })}>
      {tabs.map((tab) => (
        <button
          key={tab}
          className={css({
            px: { base: '2', md: '3' },
            py: { base: '2', md: '3' },
            textAlign: 'center',
            fontSize: { base: 'xs', md: 'sm' },
            fontWeight: getActiveTabName() === tab ? 'bold' : 'normal',
            borderBottomWidth: '2px',
            borderColor: getActiveTabName() === tab ? 'black' : 'transparent',
            _hover: { bg: 'gray.50' },
            cursor: 'pointer',
            flex: '0 0 auto',
            minWidth: 'fit-content',
            whiteSpace: 'nowrap'
          })}
          onClick={() => handleTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
} 