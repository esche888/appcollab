'use client'

import { useState, useEffect } from 'react'
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

  // Fetch current user ID
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
  useEffect(() => {
    async function loadProjects() {
      const params = new URLSearchParams()

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      if (selectedOwnerId !== 'all') {
        params.append('userId', selectedOwnerId)
      }

      const url = params.toString() ? `/api/projects?${params}` : '/api/projects'
      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        setProjects(result.data)
      }

      setLoading(false)
    }

    loadProjects()
  }, [statusFilter, selectedOwnerId])

  const statusFilters = [
    { value: 'all', label: 'All Statuses' },
    { value: 'idea', label: 'Ideas' },
    { value: 'seeking_help', label: 'Seeking Help' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ]

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Projects</h1>
          <Link href="/projects/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Owner Filter Dropdown */}
            <select
              id="owner-filter"
              value={selectedOwnerId}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
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
                    {owner.full_name || owner.username}
                  </option>
                ))}
            </select>

            {/* Status Filter Dropdown */}
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              {statusFilters.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading projects...</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 mb-4">No projects found</p>
            <Link href="/projects/new">
              <Button>Create Your First Project</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
