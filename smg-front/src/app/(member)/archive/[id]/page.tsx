'use client'

import React from 'react'
import { Container } from '../../../../../styled-system/jsx'
import { ArchiveDetail } from '../../../../components/archive/ArchiveDetail'
import { ArchiveData } from '../../../../components/archive/types'

export default function ArchiveDetailPage({ params }: { params: { id: string } }) {
  const archiveData: ArchiveData = {
    id: params.id,
    title: "2023年11月アーカイブ動画はこちらです！",
    description: "2023年11月の経営塾では、事業戦略の立て方や組織マネジメントについて詳しく解説しました。特に今回は実践的なワークショップを通じて、参加者の皆様から多くの質問が寄せられました。この動画では当日の内容をすべて収録していますので、ぜひご活用ください。資料と合わせてご覧いただくとより理解が深まります。",
    archiveType: 'regular_meeting',
    eventId: null,
    publishStartAt: null,
    publishEndAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    imageUrl: null,
    files: [
      { id: "1", fileUrl: "https://example.com/files/orientation.pdf", displayOrder: 1, description: "経営塾 第1回 オリエンテーション.pdf" },
      { id: "2", fileUrl: "https://example.com/files/report.pdf", displayOrder: 2, description: "活動報告書.pdf" },
      { id: "3", fileUrl: "https://example.com/files/pdca.pdf", displayOrder: 3, description: "PDCA管理シート (2).pdf" }
    ],
    videos: [
      { id: "1", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", displayOrder: 1 }
    ]
  }

  return (
    <Container mx="auto" py={{ base: "4", md: "6" }} px={{ base: "3", md: "4" }} maxWidth={{ base: "100%", md: "700px" }}>
      <ArchiveDetail archiveData={archiveData} />
    </Container>
  )
}
