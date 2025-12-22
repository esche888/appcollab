'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CommentsList } from './comments-list'

interface CommentsSectionProps {
  suggestionId: string
}

export function CommentsSection({ suggestionId }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })

      const result = await response.json()

      if (result.success) {
        setNewComment('')
        // Trigger refresh of comments list
        setRefreshTrigger(prev => prev + 1)
      } else {
        alert(result.error || 'Failed to post comment')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Comment submission form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="new-comment" className="block text-sm font-medium text-gray-700 mb-1">
            Add a comment
          </label>
          <textarea
            id="new-comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
            placeholder="Share your thoughts..."
            required
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Comments list */}
      <CommentsList suggestionId={suggestionId} refreshTrigger={refreshTrigger} />
    </div>
  )
}
