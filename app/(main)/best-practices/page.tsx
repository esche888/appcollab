'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BestPracticeCard } from '@/components/best-practices/best-practice-card'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { BEST_PRACTICE_CATEGORIES } from '@/types/database'
import type { BestPractice } from '@/types/database'

type BestPracticeWithProfile = BestPractice & {
  profiles: {
    id: string
    username: string
    full_name: string | null
  }
}

export default function BestPracticesPage() {
  const [bestPractices, setBestPractices] = useState<BestPracticeWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [authorFilter, setAuthorFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest')
  const [userId, setUserId] = useState<string | null>(null)

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

  // Load best practices based on filters
  useEffect(() => {
    async function loadBestPractices() {
      const params = new URLSearchParams()

      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter)
      }

      if (authorFilter !== 'all') {
        params.append('userId', authorFilter)
      }

      params.append('sort', sortBy)

      const url = params.toString()
        ? `/api/best-practices?${params}`
        : '/api/best-practices'

      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        setBestPractices(result.data)
      }

      setLoading(false)
    }

    loadBestPractices()
  }, [categoryFilter, authorFilter, sortBy])

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Best Practices</h1>
          <Link href="/best-practices/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Best Practice
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {BEST_PRACTICE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

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
                <option value="all">All Authors</option>
                {userId && <option value={userId}>My Best Practices</option>}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Upvoted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Best Practices Grid */}
        {loading ? (
          <p>Loading best practices...</p>
        ) : bestPractices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 mb-4">No best practices found</p>
            <Link href="/best-practices/new">
              <Button>Share Your First Best Practice</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bestPractices.map((bestPractice) => (
              <BestPracticeCard key={bestPractice.id} bestPractice={bestPractice} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
