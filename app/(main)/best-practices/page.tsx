'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BestPracticeCard } from '@/components/best-practices/best-practice-card'
import { RequestPanel } from '@/components/best-practices/request-panel'
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

  // Load filters from profile on mount
  useEffect(() => {
    async function loadUserAndFilters() {
      const response = await fetch('/api/profile')
      const result = await response.json()
      if (result.success) {
        setUserId(result.data.id)

        if (result.data.best_practice_filters) {
          const filters = result.data.best_practice_filters
          if (filters.category) setCategoryFilter(filters.category)
          if (filters.author) setAuthorFilter(filters.author)
          if (filters.sortBy) setSortBy(filters.sortBy)
        }
      }
    }
    loadUserAndFilters()
  }, [])

  // Save filters when changed (debounced)
  useEffect(() => {
    if (!userId) return

    const saveFilters = async () => {
      try {
        await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            best_practice_filters: {
              category: categoryFilter,
              author: authorFilter,
              sortBy
            }
          })
        })
      } catch (error) {
        console.error('Error saving filters:', error)
      }
    }

    const timeoutId = setTimeout(saveFilters, 1000)
    return () => clearTimeout(timeoutId)
  }, [categoryFilter, authorFilter, sortBy, userId])

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
    <div className="p-8 min-h-screen bg-gradient-to-br from-appcollab-teal/10 via-appcollab-blue/10 to-appcollab-green-light/10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section with Integrated Filters */}
        <div className="bg-gradient-to-r from-appcollab-green to-appcollab-teal rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Best Practices</h1>
              <p className="text-white/90">Share and discover proven patterns and solutions</p>
            </div>

          </div>

          {/* Integrated Filters */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex flex-wrap items-end gap-4">
              {/* Category Filter */}
              <div className="space-y-1 flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-white/90">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-white/70 font-medium transition-all [&>option]:text-gray-900"
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
              <div className="space-y-1 flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-white/90">Author</label>
                <select
                  value={authorFilter}
                  onChange={(e) => setAuthorFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-white/70 font-medium transition-all [&>option]:text-gray-900"
                >
                  <option value="all">All Authors</option>
                  {userId && <option value={userId}>My Best Practices</option>}
                </select>
              </div>

              {/* Sort */}
              <div className="space-y-1 flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-white/90">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular')}
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-white/70 font-medium transition-all [&>option]:text-gray-900"
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Most Upvoted</option>
                </select>
              </div>

              {/* Reset Button */}
              <div className="flex items-end flex-initial">
                <button
                  onClick={() => {
                    setCategoryFilter('all')
                    setAuthorFilter('all')
                    setSortBy('newest')
                  }}
                  className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white font-medium transition-all text-sm h-[42px] whitespace-nowrap"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {/* Main Content - Best Practices Grid */}
          <section>
            <div className="bg-white rounded-xl shadow-lg border border-appcollab-blue/20 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-appcollab-blue-dark">Best Practices Collection</h2>
                  <p className="text-sm text-gray-500">Discover and learn from proven patterns</p>
                </div>
                <Link href="/best-practices/new">
                  <Button className="bg-gradient-to-r from-appcollab-blue to-appcollab-blue-dark text-white hover:opacity-90 shadow-md font-semibold">
                    <Plus className="h-4 w-4 mr-2" />
                    New Best Practice
                  </Button>
                </Link>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading best practices...</div>
              ) : bestPractices.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <p className="text-gray-500">No best practices found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bestPractices.map((bestPractice) => (
                    <BestPracticeCard key={bestPractice.id} bestPractice={bestPractice} />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Request Panel Section */}
          <section>
            <RequestPanel />
          </section>
        </div>
      </div >
    </div >
  )
}
