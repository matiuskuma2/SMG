'use client'

import React from 'react'
import { QuestionDetailContainer } from '@/components/questions/QuestionDetailContainer'

export default function QuestionDetailPage({ params }: { params: { id: string } }) {
  return <QuestionDetailContainer questionId={params.id} />
}
