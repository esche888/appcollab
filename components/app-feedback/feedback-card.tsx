'use client'

import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import type { AppFeedback } from '@/types/database'

type FeedbackWithProfile = AppFeedback & {
  profiles: {
    id: string
    username: string
    full_name: string | null
  }
  _count?: {
    comments: number
  }
}

interface FeedbackCardProps {
  feedback: FeedbackWithProfile
  commentCount?: number
}

export function FeedbackCard({ feedback, commentCount = 0 }: FeedbackCardProps) {
  const authorName = feedback.profiles.full_name || feedback.profiles.username

  return (
    <Link href={`/feedback/${feedback.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {feedback.title}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {feedback.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>by {authorName}</span>
          <div className="flex items-center gap-4">
            <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{commentCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
