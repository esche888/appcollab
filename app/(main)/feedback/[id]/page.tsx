'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FeedbackCommentForm } from '@/components/app-feedback/comment-form'
import { FeedbackCommentsList } from '@/components/app-feedback/comments-list'
import { FeedbackForm } from '@/components/app-feedback/feedback-form'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { AppFeedback } from '@/types/database'

type FeedbackWithProfile = AppFeedback & {
  profiles: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
}

export default function FeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<FeedbackWithProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [commentsRefresh, setCommentsRefresh] = useState(0)
  const [id, setId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Unwrap params
  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  // Get current user
  useEffect(() => {
    async function getUserId() {
      const response = await fetch('/api/profile')
      const result = await response.json()
      if (result.success) {
        setUserId(result.data.id)
      }
    }
    getUserId()
  }, [])

  // Load feedback
  useEffect(() => {
    if (!id) return

    async function loadFeedback() {
      try {
        const response = await fetch(`/api/app-feedback/${id}`)
        const result = await response.json()

        if (result.success) {
          setFeedback(result.data)
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadFeedback()
  }, [id])

  const handleDelete = async () => {
    if (!id) return

    if (!confirm('Are you sure you want to delete this feedback?')) {
      return
    }

    try {
      const response = await fetch(`/api/app-feedback/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        router.push('/feedback')
      } else {
        alert(result.error || 'Failed to delete')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const handleFeedbackUpdated = () => {
    setIsEditing(false)
    // Reload feedback
    if (id) {
      fetch(`/api/app-feedback/${id}`)
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            setFeedback(result.data)
          }
        })
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !feedback) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error || 'Feedback not found'}
          </div>
          <Link href="/feedback">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Feedback
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const authorName = feedback.profiles.full_name || feedback.profiles.username
  const isOwner = userId === feedback.user_id

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/feedback">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feedback
          </Button>
        </Link>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow p-8">
          {/* Header */}
          {isEditing ? (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Edit Feedback</h2>
              <FeedbackForm
                mode="edit"
                feedbackId={feedback.id}
                initialData={{
                  title: feedback.title,
                  description: feedback.description,
                }}
                onFeedbackAdded={handleFeedbackUpdated}
                onCancel={() => setIsEditing(false)}
              />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  {feedback.title}
                </h1>

                {/* Owner Actions */}
                {isOwner && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b">
                <span>by {authorName}</span>
                <span>•</span>
                <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
              </div>

              {/* Description */}
              <div className="prose max-w-none mb-8">
                <p className="text-gray-700 whitespace-pre-wrap">{feedback.description}</p>
              </div>
            </>
          )}

          {/* Comments Section */}
          {!isEditing && (
            <div className="border-t pt-8">
              <h2 className="text-2xl font-semibold mb-6">Comments</h2>

              <div className="mb-6">
                <FeedbackCommentForm
                  feedbackId={feedback.id}
                  onCommentAdded={() => setCommentsRefresh((prev) => prev + 1)}
                />
              </div>

              <FeedbackCommentsList
                feedbackId={feedback.id}
                refreshTrigger={commentsRefresh}
                currentUserId={userId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
