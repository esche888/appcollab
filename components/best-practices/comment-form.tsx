'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface CommentFormProps {
  bestPracticeId: string
  onCommentAdded: () => void
}

export function CommentForm({ bestPracticeId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`/api/best-practices/${bestPracticeId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      const result = await response.json()

      if (result.success) {
        setContent('')
        onCommentAdded()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
          Add a Comment
        </label>
        <textarea
          id="comment"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Share your thoughts, ask questions, or provide feedback..."
          required
          maxLength={2000}
        />
        <p className="text-xs text-gray-500 mt-1">{content.length}/2000 characters</p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !content.trim()}>
          {loading ? 'Posting...' : 'Post Comment'}
        </Button>
      </div>
    </form>
  )
}
