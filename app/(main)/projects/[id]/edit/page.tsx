'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const gapTypes = [
  { value: 'idea_assessment', label: 'Idea Assessment' },
  { value: 'ux_design', label: 'UX Design' },
  { value: 'development', label: 'Development' },
  { value: 'deployment', label: 'Deployment' },
  { value: 'commercialization', label: 'Commercialization' },
  { value: 'marketing', label: 'Marketing' },
]

const statuses = [
  { value: 'draft', label: 'Draft (Private)' },
  { value: 'idea', label: 'Idea Stage' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

type Project = {
  id: string
  title: string
  short_description: string
  full_description: string | null
  website_url: string | null
  github_url: string | null
  logo_url: string | null
  owner_ids: string[]
  status: string
  project_gaps?: Array<{
    id: string
    gap_type: string
    description: string | null
  }>
}

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [loadingProject, setLoadingProject] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [project, setProject] = useState<Project | null>(null)

  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [fullDescription, setFullDescription] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [status, setStatus] = useState('idea')
  const [selectedGaps, setSelectedGaps] = useState<string[]>([])
  const [gapDescriptions, setGapDescriptions] = useState<Record<string, string>>({})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function loadProject() {
      try {
        // Get current user
        const profileResponse = await fetch('/api/profile')
        const profileResult = await profileResponse.json()
        if (profileResult.success) {
          setUserId(profileResult.data.id)
        }

        // Get project details
        const response = await fetch(`/api/projects/${params.id}`)
        const result = await response.json()

        if (result.success) {
          const projectData = result.data
          setProject(projectData)
          setTitle(projectData.title)
          setShortDescription(projectData.short_description)
          setFullDescription(projectData.full_description || '')
          setWebsiteUrl(projectData.website_url || '')
          setGithubUrl(projectData.github_url || '')
          setLogoUrl(projectData.logo_url || '')
          setStatus(projectData.status)

          // Load gaps
          if (projectData.project_gaps) {
            const gaps = projectData.project_gaps.map((g: any) => g.gap_type)
            setSelectedGaps(gaps)

            const descriptions: Record<string, string> = {}
            projectData.project_gaps.forEach((g: any) => {
              if (g.description) {
                descriptions[g.gap_type] = g.description
              }
            })
            setGapDescriptions(descriptions)
          }
        } else {
          setError('Failed to load project')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoadingProject(false)
      }
    }

    loadProject()
  }, [params.id])

  const toggleGap = (gapType: string) => {
    setSelectedGaps(prev =>
      prev.includes(gapType)
        ? prev.filter(g => g !== gapType)
        : [...prev, gapType]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          short_description: shortDescription,
          full_description: fullDescription,
          website_url: websiteUrl || null,
          github_url: githubUrl || null,
          logo_url: logoUrl || null,
          status,
        }),
      })

      const result = await response.json()

      if (result.success) {
        router.push(`/projects/${params.id}`)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        // Force a full page reload to ensure the deleted project is removed from the list
        window.location.href = '/projects'
      } else {
        setError(result.error || 'Failed to delete project')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (loadingProject) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <p>Loading project...</p>
        </div>
      </div>
    )
  }

  // Check if user is owner
  if (project && userId && !project.owner_ids.includes(userId)) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            You don't have permission to edit this project.
          </div>
          <Link href={`/projects/${params.id}`} className="inline-flex items-center text-gray-600 hover:text-gray-900 mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Link href={`/projects/${params.id}`} className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Project
        </Link>

        <h1 className="text-3xl font-bold mb-6">Edit Project</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Project Title *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Enter a catchy project name"
            />
          </div>

          <div>
            <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Short Description *
            </label>
            <input
              id="shortDescription"
              type="text"
              required
              maxLength={200}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="One-line description (max 200 characters)"
            />
            <p className="text-xs text-gray-500 mt-1">
              {shortDescription.length}/200 characters
            </p>
          </div>

          <div>
            <label htmlFor="fullDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Full Description
            </label>
            <textarea
              id="fullDescription"
              rows={6}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Describe your project in detail..."
            />
          </div>

          <div>
            <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <input
              id="websiteUrl"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700 mb-1">
              GitHub URL
            </label>
            <input
              id="githubUrl"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="https://github.com/username/repo"
            />
          </div>

          <div>
            <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Logo URL
            </label>
            <input
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL to your project&apos;s logo image (will be displayed at 64x64px)
            </p>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Project Status *
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {status === 'archived' && (
              <p className="text-sm text-orange-600 mt-1">
                Archived projects are only visible to you and administrators.
              </p>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Project
            </Button>
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/projects/${params.id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Project</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this project? This action cannot be undone.
                All associated feedback, gaps, and suggestions will also be deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Project'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
