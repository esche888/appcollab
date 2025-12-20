'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface FeedbackFormProps {
  onFeedbackAdded: () => void
  onCancel?: () => void
  initialData?: {
    title: string
    description: string
  }
  feedbackId?: string
  mode?: 'create' | 'edit'
}

export function FeedbackForm({
  onFeedbackAdded,
  onCancel,
  initialData,
  feedbackId,
  mode = 'create'
}: FeedbackFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const url = mode === 'edit' ? `/api/app-feedback/${feedbackId}` : '/api/app-feedback'
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      })

      const result = await response.json()

      if (result.success) {
        setTitle('')
        setDescription('')
        onFeedbackAdded()
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
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Brief summary of your feedback"
          required
          minLength={3}
          maxLength={200}
        />
        <p className="text-xs text-gray-500 mt-1">{title.length}/200 characters</p>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Provide details about your feedback, suggestions, or issues..."
          required
          minLength={10}
          maxLength={5000}
        />
        <p className="text-xs text-gray-500 mt-1">{description.length}/5000 characters</p>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading || !title.trim() || !description.trim()}
        >
          {loading
            ? (mode === 'edit' ? 'Updating...' : 'Submitting...')
            : (mode === 'edit' ? 'Update Feedback' : 'Submit Feedback')
          }
        </Button>
      </div>
    </form>
  )
}
