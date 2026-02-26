'use client'

import { css } from '@/styled-system/css'
import { flex, container } from '@/styled-system/patterns'
import { ProfileCard } from '@/components/mypage/ProfileCard'
import { ProfileHeader } from '@/components/mypage/ProfileHeader'
import { TabContainer } from '@/components/mypage/TabContainer'

export default function MyPage() {
  // コンテナスタイル
  const containerStyle = container({
    mx: 'auto',
    px: { base: '4', md: '24' }, 
    py: '8'
  })

  // レイアウトスタイル
  const layoutStyle = flex({
    flexDirection: { base: 'column', md: 'row' },
    gap: '8'
  })

  // 左カラムスタイル
  const leftColumnStyle = css({
    width: { base: 'full', md: '1/4' }
  })

  // 右カラムスタイル
  const rightColumnStyle = css({
    width: { base: 'full', md: '3/4' }
  })

  return (
    <div className={containerStyle}>
      <div className={layoutStyle}>
        {/* 左側カラム */}
        <div className={leftColumnStyle}>
          {/* プロフィール */}
          <ProfileCard />
        </div>

        {/* 右側カラム */}
        <div className={rightColumnStyle}>
          {/* プロフィールヘッダー */}
          <ProfileHeader />

          {/* タブメニュー */}
          <TabContainer />
        </div>
      </div>
    </div>
  )
}