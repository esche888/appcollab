'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

type Feedback = {
  id: string
  content: string
  ai_enhanced: boolean
  created_at: string
  profiles: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
}

interface FeedbackListProps {
  projectId: string
  refreshTrigger: number
}

export function FeedbackList({ projectId, refreshTrigger }: FeedbackListProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFeedback() {
      const response = await fetch(`/api/projects/${projectId}/feedback`)
      const result = await response.json()

      if (result.success) {
        setFeedback(result.data)
      }

      setLoading(false)
    }

    loadFeedback()
  }, [projectId, refreshTrigger])

  if (loading) {
    return <p className="text-gray-600">Loading feedback...</p>
  }

  if (feedback.length === 0) {
    return <p className="text-gray-600">No feedback yet. Be the first to provide feedback!</p>
  }

  return (
    <div className="space-y-4">
      {feedback.map((item) => (
        <div key={item.id} className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center">
              <span className="font-semibold text-gray-900">
                {item.profiles.full_name || item.profiles.username}
              </span>
              {item.ai_enhanced && (
                <span className="ml-2 inline-flex items-center text-xs text-purple-600">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Enhanced
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">
              {new Date(item.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{item.content}</p>
        </div>
      ))}
    </div>
  )
}
