'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CategoryBadge } from '@/components/best-practices/category-badge'
import { CommentForm } from '@/components/best-practices/comment-form'
import { CommentsList } from '@/components/best-practices/comments-list'
import { ThumbsUp, ArrowLeft, Pencil, Trash2, Archive } from 'lucide-react'
import Link from 'next/link'
import type { BestPractice } from '@/types/database'

type BestPracticeWithProfile = BestPractice & {
  profiles: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
}

export default function BestPracticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [bestPractice, setBestPractice] = useState<BestPracticeWithProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [commentsRefresh, setCommentsRefresh] = useState(0)
  const [upvoting, setUpvoting] = useState(false)
  const [id, setId] = useState<string | null>(null)

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

  // Load best practice
  useEffect(() => {
    if (!id) return

    async function loadBestPractice() {
      try {
        const response = await fetch(`/api/best-practices/${id}`)
        const result = await response.json()

        if (result.success) {
          setBestPractice(result.data)
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadBestPractice()
  }, [id])

  const handleUpvote = async () => {
    if (!id || upvoting) return

    setUpvoting(true)
    try {
      const response = await fetch(`/api/best-practices/${id}/upvote`, {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        setBestPractice((prev) =>
          prev ? { ...prev, upvotes: prev.upvotes + 1 } : null
        )
      } else {
        alert(result.error || 'Failed to upvote')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upvote')
    } finally {
      setUpvoting(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return

    if (!confirm('Are you sure you want to delete this best practice?')) {
      return
    }

    try {
      const response = await fetch(`/api/best-practices/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        router.push('/best-practices')
      } else {
        alert(result.error || 'Failed to delete')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
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

  if (error || !bestPractice) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error || 'Best practice not found'}
          </div>
          <Link href="/best-practices">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Best Practices
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const authorName = bestPractice.profiles.full_name || bestPractice.profiles.username
  const isOwner = userId === bestPractice.user_id
  const isPublished = bestPractice.status === 'published'

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/best-practices">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Best Practices
          </Button>
        </Link>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CategoryBadge category={bestPractice.category} />
                {bestPractice.status !== 'published' && (
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      bestPractice.status === 'draft'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {bestPractice.status === 'draft' ? 'Draft' : 'Archived'}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {bestPractice.title}
              </h1>
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="flex gap-2 ml-4">
                <Link href={`/best-practices/${bestPractice.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </Link>
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
            <span>{new Date(bestPractice.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <button
              onClick={handleUpvote}
              disabled={upvoting || !isPublished}
              className="flex items-center gap-1 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ThumbsUp className="h-4 w-4" />
              {bestPractice.upvotes} {bestPractice.upvotes === 1 ? 'upvote' : 'upvotes'}
            </button>
          </div>

          {/* Archived Banner */}
          {bestPractice.status === 'archived' && (
            <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded mb-6 flex items-center gap-2">
              <Archive className="h-5 w-5" />
              <span>This best practice has been archived by the author.</span>
            </div>
          )}

          {/* Description */}
          <div className="prose max-w-none mb-8">
            <p className="text-gray-700 whitespace-pre-wrap">{bestPractice.description}</p>
          </div>

          {/* Comments Section */}
          <div className="border-t pt-8">
            <h2 className="text-2xl font-semibold mb-6">Comments</h2>

            {isPublished ? (
              <>
                <div className="mb-6">
                  <CommentForm
                    bestPracticeId={bestPractice.id}
                    onCommentAdded={() => setCommentsRefresh((prev) => prev + 1)}
                  />
                </div>

                <CommentsList
                  bestPracticeId={bestPractice.id}
                  refreshTrigger={commentsRefresh}
                  currentUserId={userId}
                />
              </>
            ) : (
              <p className="text-gray-600">
                Comments are disabled for {bestPractice.status} best practices.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
