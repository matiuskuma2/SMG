import { css } from '@/styled-system/css'

const ARCHIVE_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/10M_Js5TPz4C0A_sLsSzAw88FLJxkcetvT83RhAqWDwk/edit?gid=1896638474#gid=1896638474'

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
      {/* アーカイブ一覧スプレッドシートへの外部リンクタブ */}
      <a
        href={ARCHIVE_SPREADSHEET_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={css({
          px: { base: '2', md: '3' },
          py: { base: '2', md: '3' },
          textAlign: 'center',
          fontSize: { base: 'xs', md: 'sm' },
          fontWeight: 'normal',
          borderBottomWidth: '2px',
          borderColor: 'transparent',
          _hover: { bg: 'gray.50' },
          cursor: 'pointer',
          flex: '0 0 auto',
          minWidth: 'fit-content',
          whiteSpace: 'nowrap',
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: '1',
        })}
      >
        アーカイブ一覧
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
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