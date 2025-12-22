'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ProjectCard } from '@/components/projects/project-card'
import { Plus, User, Filter } from 'lucide-react'
import Link from 'next/link'
import type { Project } from '@/types/database'

type ProjectOwner = {
  id: string
  username: string
  full_name: string | null
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('all')
  const [projectOwners, setProjectOwners] = useState<ProjectOwner[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  // Load filters from profile on mount
  useEffect(() => {
    async function loadUserAndFilters() {
      try {
        const response = await fetch('/api/profile')
        const result = await response.json()
        if (result.success) {
          setUserId(result.data.id)
          setUserRole(result.data.role)

          if (result.data.project_filters) {
            const filters = result.data.project_filters
            if (filters.status) setStatusFilter(filters.status)
            if (filters.ownerId) setSelectedOwnerId(filters.ownerId)
            if (filters.showArchived !== undefined) setShowArchived(filters.showArchived)
            if (filters.favoritesOnly !== undefined) setFavoritesOnly(filters.favoritesOnly)
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    }
    loadUserAndFilters()
  }, [])

  // Save filters when changed (debounced/effect based)
  useEffect(() => {
    if (!userId) return

    const saveFilters = async () => {
      try {
        await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_filters: {
              status: statusFilter,
              ownerId: selectedOwnerId,
              showArchived,
              favoritesOnly
            }
          })
        })
      } catch (error) {
        console.error('Error saving filters:', error)
      }
    }

    // Debounce save to avoid too many requests
    const timeoutId = setTimeout(saveFilters, 1000)
    return () => clearTimeout(timeoutId)
  }, [statusFilter, selectedOwnerId, showArchived, favoritesOnly, userId])

  // Fetch all projects to extract unique owners
  useEffect(() => {
    async function loadOwners() {
      const response = await fetch('/api/projects')
      const result = await response.json()

      if (result.success) {
        // Extract unique owner IDs from all projects
        const ownerIds = new Set<string>()
        result.data.forEach((project: Project) => {
          project.owner_ids.forEach((ownerId: string) => {
            ownerIds.add(ownerId)
          })
        })

        // Fetch profile information for each owner
        const ownerProfiles = await Promise.all(
          Array.from(ownerIds).map(async (ownerId) => {
            const profileResponse = await fetch(`/api/profiles/${ownerId}`)
            const profileResult = await profileResponse.json()
            if (profileResult.success) {
              return {
                id: ownerId,
                username: profileResult.data.username,
                full_name: profileResult.data.full_name,
              }
            }
            return null
          })
        )

        setProjectOwners(ownerProfiles.filter((p): p is ProjectOwner => p !== null))
      }
    }

    loadOwners()
  }, [])

  // Load projects based on filters
  const loadProjects = useCallback(async () => {
    const params = new URLSearchParams()

    if (statusFilter !== 'all') {
      params.append('status', statusFilter)
    }

    if (selectedOwnerId !== 'all') {
      params.append('userId', selectedOwnerId)
    }

    // Include archived if toggle is on
    if (showArchived) {
      params.append('includeArchived', 'true')
    }

    // Filter favorites only if toggle is on
    if (favoritesOnly) {
      params.append('favoritesOnly', 'true')
    }

    const url = params.toString() ? `/api/projects?${params}` : '/api/projects'
    const response = await fetch(url)
    const result = await response.json()

    if (result.success) {
      setProjects(result.data)
    }

    setLoading(false)
  }, [statusFilter, selectedOwnerId, showArchived, favoritesOnly])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const statusFilters = [
    { value: 'all', label: 'All Statuses' },
    { value: 'draft', label: 'Drafts (Private)' },
    { value: 'idea', label: 'Ideas' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'archived', label: 'Archived' },
  ]

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-appcollab-teal/10 via-appcollab-blue/10 to-appcollab-green-light/10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section with Integrated Filters */}
        <div className="bg-gradient-to-r from-appcollab-teal-dark to-appcollab-blue rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Projects</h1>
              <p className="text-white/90">Explore and collaborate on exciting projects</p>
            </div>
            <Link href="/projects/new">
              <Button className="bg-white text-appcollab-teal-dark hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>

          {/* Integrated Filters */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">

            <div className="flex flex-wrap items-end gap-4">
              {/* Owner Filter */}
              <div className="space-y-1 flex-1 min-w-[200px]">
                <select
                  id="owner-filter"
                  value={selectedOwnerId}
                  onChange={(e) => setSelectedOwnerId(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-white/70 font-medium transition-all [&>option]:text-gray-900"
                >
                  <option value="all">All Owners</option>
                  {userId && (
                    <option value={userId}>My Projects</option>
                  )}
                  <option disabled>─────────────</option>
                  {projectOwners
                    .filter(owner => owner.id !== userId)
                    .sort((a, b) => (a.username || '').localeCompare(b.username || ''))
                    .map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.username}
                      </option>
                    ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1 flex-1 min-w-[200px]">
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-white/70 font-medium transition-all [&>option]:text-gray-900"
                >
                  {statusFilters.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Favorites Checkbox */}
              <div>
                <label className="flex items-center cursor-pointer bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors border border-white/10 h-[42px] whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={favoritesOnly}
                    onChange={(e) => setFavoritesOnly(e.target.checked)}
                    className="mr-3 h-4 w-4 text-appcollab-teal focus:ring-white/50 bg-white/20 border-white/40 rounded transition-all"
                  />
                  <span className="text-sm font-medium text-white">
                    Only favorites
                  </span>
                </label>
              </div>

              {/* Archived Checkbox (Conditional) */}
              {(selectedOwnerId === userId || userRole === 'admin') && (
                <div>
                  <label className="flex items-center cursor-pointer bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors border border-white/10 h-[42px] whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={showArchived}
                      onChange={(e) => setShowArchived(e.target.checked)}
                      className="mr-3 h-4 w-4 text-appcollab-teal focus:ring-white/50 bg-white/20 border-white/40 rounded transition-all"
                    />
                    <span className="text-sm font-medium text-white">
                      Show archived
                      {userRole === 'admin' && selectedOwnerId === 'all' && ' (all)'}
                    </span>
                  </label>
                </div>
              )}

              {/* Reset Button */}
              <div>
                <button
                  onClick={() => {
                    setStatusFilter('all')
                    setSelectedOwnerId('all')
                    setShowArchived(false)
                    setFavoritesOnly(false)
                  }}
                  className="h-[42px] px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/20 hover:border-white/40 whitespace-nowrap shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border-2 border-appcollab-teal/20">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-appcollab-teal-dark to-appcollab-blue bg-clip-text text-transparent mb-6">
            {loading ? 'Loading...' : projects.length === 0 ? 'No Projects' : `All Projects (${projects.length})`}
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-appcollab-teal/10 to-appcollab-blue/10 rounded-xl border-2 border-dashed border-appcollab-teal/30">
              <p className="text-gray-600 mb-6 text-lg">No projects found</p>
              <Link href="/projects/new">
                <Button className="bg-gradient-to-r from-appcollab-teal to-appcollab-blue hover:from-appcollab-teal-dark hover:to-appcollab-blue-dark text-white shadow-lg">Create Your First Project</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} onFavoriteChange={loadProjects} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
