'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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

export default function FeedbackPage() {
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
    async function loadFeedback() {
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
  }, [sortBy, authorFilter])

  const handleFeedbackAdded = () => {
    setShowForm(false)
    // Reload feedback
    setSortBy((prev) => prev) // Trigger useEffect
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">App Feedback</h1>
            <p className="text-gray-600 mt-1">Share your thoughts and help improve AppCollab</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
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

        {/* Create Form */}
        {showForm && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Submit Feedback</h2>
            <FeedbackForm
              onFeedbackAdded={handleFeedbackAdded}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Author Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author
              </label>
              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feedback Grid */}
        {loading ? (
          <p>Loading feedback...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  )
}
