'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import type { AppFeedbackComment } from '@/types/database'

type CommentWithProfile = AppFeedbackComment & {
  profiles: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
}

interface CommentsListProps {
  feedbackId: string
  refreshTrigger: number
  currentUserId: string | null
}

export function FeedbackCommentsList({ feedbackId, refreshTrigger, currentUserId }: CommentsListProps) {
  const [comments, setComments] = useState<CommentWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadComments = async () => {
    const response = await fetch(`/api/app-feedback/${feedbackId}/comments`)
    const result = await response.json()

    if (result.success) {
      setComments(result.data)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadComments()
  }, [feedbackId, refreshTrigger])

  const handleEdit = (comment: CommentWithProfile) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const handleSaveEdit = async (commentId: string) => {
    setSubmitting(true)
    try {
      const response = await fetch(
        `/api/app-feedback/${feedbackId}/comments/${commentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: editContent }),
        }
      )

      const result = await response.json()

      if (result.success) {
        await loadComments()
        setEditingId(null)
        setEditContent('')
      } else {
        alert(result.error || 'Failed to update comment')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/app-feedback/${feedbackId}/comments/${commentId}`,
        {
          method: 'DELETE',
        }
      )

      const result = await response.json()

      if (result.success) {
        await loadComments()
      } else {
        alert(result.error || 'Failed to delete comment')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete comment')
    }
  }

  if (loading) {
    return <p className="text-gray-600">Loading comments...</p>
  }

  if (comments.length === 0) {
    return (
      <p className="text-gray-600 text-center py-8">
        No comments yet. Be the first to share your thoughts!
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const authorName = comment.profiles.full_name || comment.profiles.username
        const isOwner = currentUserId === comment.user_id
        const isEditing = editingId === comment.id

        return (
          <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-semibold text-gray-900">{authorName}</span>
                <span className="text-sm text-gray-500 ml-2">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              {isOwner && !isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(comment)}
                    className="text-gray-600 hover:text-blue-600"
                    title="Edit comment"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-gray-600 hover:text-red-600"
                    title="Delete comment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  maxLength={2000}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSaveEdit(comment.id)}
                    disabled={submitting || !editContent.trim()}
                  >
                    {submitting ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
