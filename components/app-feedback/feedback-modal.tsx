'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog'
import { FeedbackCard } from '@/components/app-feedback/feedback-card'
import { FeedbackForm } from '@/components/app-feedback/feedback-form'
import { Plus, X } from 'lucide-react'
import type { AppFeedback } from '@/types/database'

type FeedbackWithProfile = AppFeedback & {
  profiles: {
    id: string
    username: string
    full_name: string | null
  }
}

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [feedbackList, setFeedbackList] = useState<FeedbackWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [authorFilter, setAuthorFilter] = useState<string>('all')
  const [userId, setUserId] = useState<string | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})

  // Get current user ID
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

  // Load feedback based on filters
  useEffect(() => {
    if (!open) return

    async function loadFeedback() {
      setLoading(true)
      const params = new URLSearchParams()

      if (authorFilter !== 'all') {
        params.append('userId', authorFilter)
      }

      params.append('sort', sortBy)

      const url = params.toString()
        ? `/api/app-feedback?${params}`
        : '/api/app-feedback'

      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        setFeedbackList(result.data)

        // Load comment counts for each feedback
        const counts: Record<string, number> = {}
        await Promise.all(
          result.data.map(async (feedback: FeedbackWithProfile) => {
            const commentsResponse = await fetch(`/api/app-feedback/${feedback.id}/comments`)
            const commentsResult = await commentsResponse.json()
            if (commentsResult.success) {
              counts[feedback.id] = commentsResult.data.length
            }
          })
        )
        setCommentCounts(counts)
      }

      setLoading(false)
    }

    loadFeedback()
  }, [open, sortBy, authorFilter])

  const handleFeedbackAdded = () => {
    setShowForm(false)
    // Reload feedback
    setSortBy((prev) => prev) // Trigger useEffect
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
          <div className="flex flex-col h-full max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  App Feedback
                </DialogTitle>
                <p className="text-gray-600 text-sm mt-1">Share your thoughts and help improve AppCollab</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowForm(!showForm)}
                  variant={showForm ? "outline" : "default"}
                  size="sm"
                >
                  {showForm ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      New Feedback
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Create Form */}
              {showForm && (
                <div className="mb-6 bg-slate-50 rounded-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Submit Feedback</h3>
                  <FeedbackForm
                    onFeedbackAdded={handleFeedbackAdded}
                    onCancel={() => setShowForm(false)}
                  />
                </div>
              )}

              {/* Filters */}
              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Author Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Author
                    </label>
                    <select
                      value={authorFilter}
                      onChange={(e) => setAuthorFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="all">All Feedback</option>
                      {userId && <option value={userId}>My Feedback</option>}
                    </select>
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Feedback Grid */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="text-gray-600 mt-2">Loading feedback...</p>
                </div>
              ) : feedbackList.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No feedback yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {feedbackList.map((feedback) => (
                    <FeedbackCard
                      key={feedback.id}
                      feedback={feedback}
                      commentCount={commentCounts[feedback.id] || 0}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
