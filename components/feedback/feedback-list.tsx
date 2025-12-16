'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Reply } from 'lucide-react'
import { Button } from '@/components/ui/button'

type FeedbackItem = {
  id: string
  title: string | null
  content: string
  ai_enhanced: boolean
  created_at: string
  parent_id: string | null
  profiles: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
  replies?: FeedbackItem[]
}

interface FeedbackListProps {
  projectId: string
  refreshTrigger: number
}

export function FeedbackList({ projectId, refreshTrigger }: FeedbackListProps) {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

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

  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim()) return

    setSubmittingReply(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          parent_id: parentId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Reload feedback to show the new reply
        const feedbackResponse = await fetch(`/api/projects/${projectId}/feedback`)
        const feedbackResult = await feedbackResponse.json()
        if (feedbackResult.success) {
          setFeedback(feedbackResult.data)
        }
        setReplyContent('')
        setReplyingTo(null)
      } else {
        alert(result.error || 'Failed to post reply')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to post reply')
    } finally {
      setSubmittingReply(false)
    }
  }

  const renderFeedbackItem = (item: FeedbackItem, isReply: boolean = false) => (
    <div key={item.id} className={`${isReply ? 'ml-8 mt-3' : ''}`}>
      <div className={`${isReply ? 'bg-white border border-gray-200' : 'bg-gray-50'} rounded-lg p-4`}>
        {/* Title - only for top-level comments */}
        {!isReply && item.title && (
          <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
        )}

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
        <p className="text-gray-700 whitespace-pre-wrap mb-2">{item.content}</p>

        {!isReply && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setReplyingTo(item.id)
              setReplyContent('')
            }}
            className="text-blue-600 hover:text-blue-700"
          >
            <Reply className="h-4 w-4 mr-1" />
            Reply
          </Button>
        )}

        {replyingTo === item.id && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReplyingTo(null)
                  setReplyContent('')
                }}
                disabled={submittingReply}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleReplySubmit(item.id)}
                disabled={submittingReply || !replyContent.trim()}
              >
                {submittingReply ? 'Posting...' : 'Post Reply'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Render replies */}
      {item.replies && item.replies.length > 0 && (
        <div className="space-y-3">
          {item.replies.map((reply) => renderFeedbackItem(reply, true))}
        </div>
      )}
    </div>
  )

  if (loading) {
    return <p className="text-gray-600">Loading feedback...</p>
  }

  if (feedback.length === 0) {
    return <p className="text-gray-600">No feedback yet. Be the first to provide feedback!</p>
  }

  return (
    <div className="space-y-4">
      {feedback.map((item) => renderFeedbackItem(item))}
    </div>
  )
}
