'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Reply, Edit, Trash2 } from 'lucide-react'
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
  const [userId, setUserId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [submittingEdit, setSubmittingEdit] = useState(false)

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

  useEffect(() => {
    async function getCurrentUser() {
      const response = await fetch('/api/profile')
      const result = await response.json()
      if (result.success) {
        setUserId(result.data.id)
      }
    }
    getCurrentUser()
  }, [])

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

  const handleEditStart = (item: FeedbackItem) => {
    setEditingId(item.id)
    setEditTitle(item.title || '')
    setEditContent(item.content)
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditTitle('')
    setEditContent('')
  }

  const handleEditSubmit = async (feedbackId: string, isReply: boolean) => {
    if (!editContent.trim()) return

    setSubmittingEdit(true)
    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: isReply ? null : editTitle,
          content: editContent,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Reload feedback
        const feedbackResponse = await fetch(`/api/projects/${projectId}/feedback`)
        const feedbackResult = await feedbackResponse.json()
        if (feedbackResult.success) {
          setFeedback(feedbackResult.data)
        }
        setEditingId(null)
        setEditTitle('')
        setEditContent('')
      } else {
        alert(result.error || 'Failed to update feedback')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update feedback')
    } finally {
      setSubmittingEdit(false)
    }
  }

  const handleDelete = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        // Reload feedback
        const feedbackResponse = await fetch(`/api/projects/${projectId}/feedback`)
        const feedbackResult = await feedbackResponse.json()
        if (feedbackResult.success) {
          setFeedback(feedbackResult.data)
        }
      } else {
        alert(result.error || 'Failed to delete feedback')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete feedback')
    }
  }

  const renderFeedbackItem = (item: FeedbackItem, isReply: boolean = false) => {
    const isAuthor = userId === item.profiles.id
    const isEditing = editingId === item.id

    return (
      <div key={item.id} className={`${isReply ? 'ml-8 mt-3' : ''}`}>
        <div className={`${isReply ? 'bg-white border border-gray-200' : 'bg-gray-50'} rounded-lg p-4`}>
          {isEditing ? (
            // Edit mode
            <div className="space-y-3">
              {!isReply && (
                <div>
                  <label htmlFor={`edit-title-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    id={`edit-title-${item.id}`}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                    placeholder="Brief summary of your feedback"
                    required
                  />
                </div>
              )}
              <div>
                <label htmlFor={`edit-content-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  {isReply ? 'Reply *' : 'Feedback *'}
                </label>
                <textarea
                  id={`edit-content-${item.id}`}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                  placeholder={isReply ? "Your reply..." : "Your feedback..."}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditCancel}
                  disabled={submittingEdit}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleEditSubmit(item.id, isReply)}
                  disabled={submittingEdit || !editContent.trim() || (!isReply && !editTitle.trim())}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            // View mode
            <>
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
              <p className="text-gray-700 whitespace-pre-wrap mb-3">{item.content}</p>

              <div className="flex gap-2">
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
                {isAuthor && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditStart(item)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </>
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
  }

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
