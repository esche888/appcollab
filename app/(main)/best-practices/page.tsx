'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BestPracticeCard } from '@/components/best-practices/best-practice-card'
import { RequestPanel } from '@/components/best-practices/request-panel'
import { Plus, Filter } from 'lucide-react'
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
            <Link href="/best-practices/new">
              <Button className="bg-white text-appcollab-green hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                New Best Practice
              </Button>
            </Link>
          </div>

          {/* Integrated Filters */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-2 mb-4 text-white">
              <Filter className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Filter Best Practices</h2>
              <button
                onClick={() => {
                  setCategoryFilter('all')
                  setAuthorFilter('all')
                  setSortBy('newest')
                }}
                className="ml-auto text-xs text-white/70 hover:text-white underline"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div className="space-y-1">
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
              <div className="space-y-1">
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
              <div className="space-y-1">
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
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {/* Main Content - Best Practices Grid */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-appcollab-blue-dark">Best Practices Collection</h2>
            </div>

            {loading ? (
              <p>Loading best practices...</p>
            ) : bestPractices.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-600 mb-4">No best practices found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bestPractices.map((bestPractice) => (
                  <BestPracticeCard key={bestPractice.id} bestPractice={bestPractice} />
                ))}
              </div>
            )}
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
