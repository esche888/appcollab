'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BEST_PRACTICE_CATEGORIES } from '@/types/database'
import type { BestPractice } from '@/types/database'

interface BestPracticeFormProps {
  initialData?: BestPractice
  mode: 'create' | 'edit'
  onSubmit: (data: {
    title: string
    description: string
    category: string
    status: 'draft' | 'published' | 'archived'
  }) => Promise<void>
  onCancel: () => void
}

export function BestPracticeForm({ initialData, mode, onSubmit, onCancel }: BestPracticeFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [category, setCategory] = useState(initialData?.category || 'development')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(
    initialData?.status || 'draft'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (submitStatus: 'draft' | 'published' | 'archived') => {
    setError(null)
    setLoading(true)

    try {
      await onSubmit({
        title,
        description,
        category,
        status: submitStatus,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter a clear, concise title"
          maxLength={200}
        />
        <p className="text-xs text-gray-500 mt-1">{title.length}/200 characters</p>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category *
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as typeof category)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {BEST_PRACTICE_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          id="description"
          rows={10}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe the best practice in detail. Include the why, what, and how."
          maxLength={5000}
        />
        <p className="text-xs text-gray-500 mt-1">{description.length}/5000 characters</p>
      </div>

      {/* Status (Edit mode only) */}
      {mode === 'edit' && (
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {status === 'draft' && 'Visible only to you'}
            {status === 'published' && 'Visible to everyone'}
            {status === 'archived' && 'Marked as archived, still visible'}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>

        {mode === 'create' ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit('draft')}
              disabled={loading || !title.trim() || !description.trim()}
            >
              {loading ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit('published')}
              disabled={loading || !title.trim() || !description.trim()}
            >
              {loading ? 'Publishing...' : 'Publish'}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            onClick={() => handleSubmit(status)}
            disabled={loading || !title.trim() || !description.trim()}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>
    </form>
  )
}
