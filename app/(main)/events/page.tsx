'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { EventCard } from '@/components/events/event-card'
import { Clock, Star, Users } from 'lucide-react'
import type { AuditLog } from '@/types/database'

type EnrichedEvent = AuditLog & {
  profiles?: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
  project?: {
    id: string
    title: string
    logo_url: string | null
  }
}

export default function RecentEventsPage() {
  const [events, setEvents] = useState<EnrichedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('30d')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [contributingOnly, setContributingOnly] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  // Load user and filters from profile on mount
  useEffect(() => {
    async function loadUserAndFilters() {
      try {
        const response = await fetch('/api/profile')
        const result = await response.json()
        if (result.success) {
          setUserId(result.data.id)

          if (result.data.event_filters) {
            const filters = result.data.event_filters
            if (filters.category) setCategoryFilter(filters.category)
            if (filters.projectId) setProjectFilter(filters.projectId)
            if (filters.timeRange) setTimeRange(filters.timeRange)
            if (filters.favoritesOnly !== undefined) setFavoritesOnly(filters.favoritesOnly)
            if (filters.contributingOnly !== undefined) setContributingOnly(filters.contributingOnly)
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    }
    loadUserAndFilters()
  }, [])

  // Load all projects for filter dropdown
  useEffect(() => {
    async function loadProjects() {
      const response = await fetch('/api/projects')
      const result = await response.json()
      if (result.success) {
        setProjects(result.data)
      }
    }
    loadProjects()
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
            event_filters: {
              category: categoryFilter,
              projectId: projectFilter,
              timeRange,
              favoritesOnly,
              contributingOnly
            }
          })
        })
      } catch (error) {
        console.error('Error saving filters:', error)
      }
    }

    const timeoutId = setTimeout(saveFilters, 1000)
    return () => clearTimeout(timeoutId)
  }, [categoryFilter, projectFilter, timeRange, favoritesOnly, contributingOnly, userId])

  // Load events based on filters
  const loadEvents = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()

    if (categoryFilter !== 'all') {
      params.append('category', categoryFilter)
    }

    if (projectFilter !== 'all') {
      params.append('projectId', projectFilter)
    }

    params.append('timeRange', timeRange)

    if (favoritesOnly) {
      params.append('favoritesOnly', 'true')
    }

    if (contributingOnly) {
      params.append('contributingOnly', 'true')
    }

    params.append('page', currentPage.toString())

    const url = `/api/events?${params.toString()}`
    const response = await fetch(url)
    const result = await response.json()

    if (result.success) {
      setEvents(result.data)
      setTotalCount(result.count)
    }

    setLoading(false)
  }, [categoryFilter, projectFilter, timeRange, favoritesOnly, contributingOnly, currentPage])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const categoryFilters = [
    { value: 'all', label: 'All Events' },
    { value: 'user-related', label: 'User Activity' },
    { value: 'project-related', label: 'Project Activity' },
  ]

  const timeRangeOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: 'all', label: 'All Time' },
  ]

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        {/* Header Section with Integrated Filters */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Recent Events</h1>
              <p className="text-white/90">Stay updated with platform activity</p>
            </div>
            <Clock className="h-12 w-12 text-white/80" />
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
                  {categoryFilters.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Filter */}
              <div className="space-y-1 flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-white/90">Project</label>
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-white/70 font-medium transition-all [&>option]:text-gray-900"
                >
                  <option value="all">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Range Filter */}
              <div className="space-y-1 flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-white/90">Time Range</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-white/70 font-medium transition-all [&>option]:text-gray-900"
                >
                  {timeRangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Favorites Only Checkbox */}
              <div>
                <label className="flex items-center cursor-pointer bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors border border-white/10 h-[42px] whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={favoritesOnly}
                    onChange={(e) => setFavoritesOnly(e.target.checked)}
                    className="mr-3 h-4 w-4 text-purple-600 focus:ring-white/50 bg-white/20 border-white/40 rounded transition-all"
                  />
                  <Star className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium text-white">
                    Favorites only
                  </span>
                </label>
              </div>

              {/* Contributing Only Checkbox */}
              <div>
                <label className="flex items-center cursor-pointer bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors border border-white/10 h-[42px] whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={contributingOnly}
                    onChange={(e) => setContributingOnly(e.target.checked)}
                    className="mr-3 h-4 w-4 text-purple-600 focus:ring-white/50 bg-white/20 border-white/40 rounded transition-all"
                  />
                  <Users className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium text-white">
                    Contributing to
                  </span>
                </label>
              </div>

              {/* Reset Button */}
              <div>
                <button
                  onClick={() => {
                    setCategoryFilter('all')
                    setProjectFilter('all')
                    setTimeRange('30d')
                    setFavoritesOnly(false)
                    setContributingOnly(false)
                    setCurrentPage(1)
                  }}
                  className="h-[42px] px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/20 hover:border-white/40 whitespace-nowrap shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border-2 border-purple-200">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            {loading ? 'Loading...' : events.length === 0 ? 'No Events' : `Activity Feed (${totalCount})`}
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-dashed border-purple-300">
              <Clock className="h-16 w-16 text-purple-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2 text-lg">No events found</p>
              <p className="text-gray-500 text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>

              {/* Pagination */}
              {totalCount > 50 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * 50) + 1} to {Math.min(currentPage * 50, totalCount)} of {totalCount} events
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="px-4 py-2">
                      Page {currentPage} of {Math.ceil(totalCount / 50)}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={currentPage >= Math.ceil(totalCount / 50)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
