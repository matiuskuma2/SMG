'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ArchivePage() {
  const router = useRouter()

  // 初期ロード時に定例会のタブページにリダイレクト
  useEffect(() => {
    router.push('/archive/tabs/regular')
  }, [router])

  return null
}
