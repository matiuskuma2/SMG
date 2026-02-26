import { css } from '@/styled-system/css'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ApplicationHistoryTab } from './ApplicationHistoryTab'
import { EventHistoryTab } from './EventHistoryTab'
import { NFCHistoryTab } from './NFCHistoryTab'
import { QuestionHistoryTab } from './QuestionHistoryTab'

// タブ名とクエリパラメータのマッピング
const TAB_MAPPING: Record<string, string> = {
  '懇親会履歴': 'gather-history',
  'NFC交換履歴': 'nfc-history',
  '質問履歴': 'question-history',
  'イベント申し込み履歴': 'application-history',
}

// 逆マッピングを自動生成
const REVERSE_TAB_MAPPING = Object.fromEntries(
  Object.entries(TAB_MAPPING).map(([key, value]) => [value, key])
)

export const TabContainer = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  // クエリパラメータからタブを初期化、なければデフォルトはNFC交換履歴
  const [activeTab, setActiveTab] = useState(
    tabParam ? REVERSE_TAB_MAPPING[tabParam] || 'NFC交換履歴' : 'NFC交換履歴'
  )

  // クエリパラメータが変更された時にタブを更新
  useEffect(() => {
    if (tabParam && REVERSE_TAB_MAPPING[tabParam]) {
      setActiveTab(REVERSE_TAB_MAPPING[tabParam])
    }
  }, [tabParam])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    const tabKey = TAB_MAPPING[tab]
    router.push(`/mypage?tab=${tabKey}`, { scroll: false })
  }

  return (
    <div className={css({
      bg: 'white',
      rounded: 'lg',
      shadow: 'md',
      mb: '4'
    })}>
      {/* タブヘッダー */}
      <div className={css({
        display: 'flex',
        borderBottomWidth: '1px',
        borderColor: 'gray.200',
        width: 'full',
        overflowX: { base: 'auto', md: 'visible' },
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none'
        }
      })}>
        {['懇親会履歴', 'NFC交換履歴', '質問履歴', 'イベント申し込み履歴'].map((tab) => (
          <button
            key={tab}
            className={css({
              px: { base: '2', sm: '4', md: '8' },
              py: { base: '2', md: '3' },
              flex: { base: '0 0 auto', md: '1' },
              minWidth: { base: 'fit-content', md: 'auto' },
              textAlign: 'center',
              fontSize: { base: 'xs', sm: 'sm', md: 'md' },
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              borderBottomWidth: '2px',
              borderColor: activeTab === tab ? 'black' : 'transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              _hover: { bg: 'gray.50' }
            })}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className={css({ p: '4' })}>
        {activeTab === '懇親会履歴' ? (
            <EventHistoryTab />
          ) : activeTab === 'NFC交換履歴' ? (
            <NFCHistoryTab />
          ) : activeTab === '質問履歴' ? (
            <QuestionHistoryTab />
          ) : activeTab === 'イベント申し込み履歴' ? (
            <ApplicationHistoryTab />
          ) : (
          <p className={css({ color: 'gray.500', textAlign: 'center', py: '8' })}>
            {activeTab}のコンテンツは後で実装します
          </p>
        )}
      </div>
    </div>
  )
}
