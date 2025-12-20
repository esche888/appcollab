'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, AlertCircle, MessageSquare, Edit, Trash2, Plus, X, ExternalLink, Github } from 'lucide-react'
import Link from 'next/link'
import { FeedbackForm } from '@/components/feedback/feedback-form'
import { FeedbackList } from '@/components/feedback/feedback-list'
import { FeatureSuggestions } from '@/components/projects/feature-suggestions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ProjectWithGaps = {
  id: string
  title: string
  short_description: string
  full_description: string | null
  website_url: string | null
  github_url: string | null
  owner_ids: string[]
  status: string
  created_at: string
  project_gaps: Array<{
    id: string
    gap_type: string
    description: string | null
    is_filled: boolean
    status: 'open' | 'filled' | 'suspended'
    gap_contributors: Array<{
      id: string
      user_id: string
      status: string
      profiles: {
        id: string
        username: string
        full_name: string | null
      }
    }>
  }>
}

const statusColors = {
  idea: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-blue-100 text-blue-800',
  on_hold: 'bg-gray-100 text-gray-800',
  completed: 'bg-green-100 text-green-800',
  archived: 'bg-orange-100 text-orange-800',
}

const statusLabels = {
  idea: 'Idea',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  archived: 'Archived',
}

const gapTypeLabels: Record<string, string> = {
  idea_assessment: 'Idea Assessment',
  ux_design: 'UX Design',
  development: 'Development',
  deployment: 'Deployment',
  commercialization: 'Commercialization',
  marketing: 'Marketing',
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<ProjectWithGaps | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [feedbackRefresh, setFeedbackRefresh] = useState(0)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showGapDialog, setShowGapDialog] = useState(false)
  const [editingGap, setEditingGap] = useState<{ id?: string; gap_type: string; description: string } | null>(null)
  const [savingGap, setSavingGap] = useState(false)

  useEffect(() => {
    async function loadProject() {
      const response = await fetch(`/api/projects/${params.id}`)
      const result = await response.json()

      if (result.success) {
        setProject(result.data)
      }

      // Get current user ID and role
      const profileResponse = await fetch('/api/profile')
      const profileResult = await profileResponse.json()
      if (profileResult.success) {
        setUserId(profileResult.data.id)
        setUserRole(profileResult.data.role)
      }

      setLoading(false)
    }

    loadProject()
  }, [params.id])

  const handleTagSelf = async (gapId: string) => {
    const response = await fetch(`/api/gaps/${gapId}/contribute`, {
      method: 'POST',
    })

    const result = await response.json()

    if (result.success) {
      // Reload project to show updated contributors
      const projectResponse = await fetch(`/api/projects/${params.id}`)
      const projectResult = await projectResponse.json()
      if (projectResult.success) {
        setProject(projectResult.data)
      }
    } else {
      alert(result.error)
    }
  }

  const handleUntagSelf = async (gapId: string) => {
    const response = await fetch(`/api/gaps/${gapId}/contribute`, {
      method: 'DELETE',
    })

    const result = await response.json()

    if (result.success) {
      // Reload project
      const projectResponse = await fetch(`/api/projects/${params.id}`)
      const projectResult = await projectResponse.json()
      if (projectResult.success) {
        setProject(projectResult.data)
      }
    }
  }

  const isUserTagged = (gap: ProjectWithGaps['project_gaps'][0]) => {
    return gap.gap_contributors.some(c => c.user_id === userId)
  }

  const isOwner = project && userId && project.owner_ids.includes(userId)

  const handleDelete = async () => {
    if (!project) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        router.push('/projects')
      } else {
        alert(result.error || 'Failed to delete project')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete project')
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleAddGap = () => {
    setEditingGap({ gap_type: 'development', description: '' })
    setShowGapDialog(true)
  }

  const handleEditGap = (gap: ProjectWithGaps['project_gaps'][0]) => {
    setEditingGap({ id: gap.id, gap_type: gap.gap_type, description: gap.description || '' })
    setShowGapDialog(true)
  }

  const handleSaveGap = async () => {
    if (!editingGap || !project) return

    setSavingGap(true)
    try {
      const url = editingGap.id
        ? `/api/gaps/${editingGap.id}`
        : `/api/projects/${project.id}/gaps`

      const response = await fetch(url, {
        method: editingGap.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gap_type: editingGap.gap_type,
          description: editingGap.description,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Reload project
        const projectResponse = await fetch(`/api/projects/${params.id}`)
        const projectResult = await projectResponse.json()
        if (projectResult.success) {
          setProject(projectResult.data)
        }
        setShowGapDialog(false)
        setEditingGap(null)
      } else {
        alert(result.error || 'Failed to save gap')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save gap')
    } finally {
      setSavingGap(false)
    }
  }

  const handleDeleteGap = async (gapId: string) => {
    if (!confirm('Are you sure you want to delete this gap?')) return

    try {
      const response = await fetch(`/api/gaps/${gapId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        // Reload project
        const projectResponse = await fetch(`/api/projects/${params.id}`)
        const projectResult = await projectResponse.json()
        if (projectResult.success) {
          setProject(projectResult.data)
        }
      } else {
        alert(result.error || 'Failed to delete gap')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete gap')
    }
  }

  const handleUpdateGapStatus = async (gapId: string, newStatus: 'open' | 'filled' | 'suspended') => {
    try {
      const response = await fetch(`/api/gaps/${gapId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (result.success) {
        // Reload project
        const projectResponse = await fetch(`/api/projects/${params.id}`)
        const projectResult = await projectResponse.json()
        if (projectResult.success) {
          setProject(projectResult.data)
        }
      } else {
        alert(result.error || 'Failed to update gap status')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update gap status')
    }
  }

  if (loading) {
    return (
      <div className="p-8 min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-purple-100">
            <p className="text-gray-600 text-lg">Loading project...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-8 min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-red-200">
            <p className="text-red-600 text-lg font-semibold">Project not found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto">
        <Link href="/projects" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Link>

        {/* Project Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{project.title}</h1>
              <p className="text-lg text-blue-100">{project.short_description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[project.status as keyof typeof statusColors]} shadow-md`}>
                {statusLabels[project.status as keyof typeof statusLabels]}
              </span>
              {isOwner && (
                <>
                  <Link href={`/projects/${project.id}/edit`}>
                    <Button className="bg-white text-blue-600 hover:bg-blue-50" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="bg-white text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
          {(project.website_url || project.github_url) && (
            <div className="flex gap-4">
              {project.website_url && (
                <a
                  href={project.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-white hover:text-blue-100 font-medium transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit App Website
                </a>
              )}
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-white hover:text-blue-100 font-medium transition-colors"
                >
                  <Github className="h-4 w-4 mr-2" />
                  View on GitHub
                </a>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-purple-100">

          {project.status === 'archived' && (
            <div className="mb-6 bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-900 font-medium">
                <strong>This project is archived.</strong> It is only visible to {isOwner ? 'you as the owner' : 'owners'} and administrators.
                {isOwner && ' You can unarchive it by editing the project status.'}
              </p>
            </div>
          )}

          {project.full_description && (
            <div className="mb-8 pb-8 border-b-2 border-gray-100">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">About This Project</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{project.full_description}</p>
            </div>
          )}

          {/* Help Needed Section */}
          <div className="mb-8 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border-2 border-yellow-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-yellow-900 flex items-center">
                <AlertCircle className="h-6 w-6 mr-2 text-yellow-600" />
                Help Needed
              </h2>
              {isOwner && (
                <Button size="sm" onClick={handleAddGap} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Gap
                </Button>
              )}
            </div>

            {project.project_gaps.length === 0 ? (
              <p className="text-yellow-800 font-medium">No specific help needed at the moment.</p>
            ) : (
              <div className="space-y-4">
                {project.project_gaps.map((gap) => (
                  <div key={gap.id} className="bg-white rounded-lg p-6 shadow-md border border-yellow-100">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {gapTypeLabels[gap.gap_type]}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            gap.status === 'filled' ? 'bg-green-100 text-green-800' :
                            gap.status === 'suspended' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {gap.status === 'filled' ? 'Filled' : gap.status === 'suspended' ? 'Suspended' : 'Open'}
                          </span>
                        </div>
                        {gap.description && (
                          <p className="text-gray-600">{gap.description}</p>
                        )}
                        {isOwner && (
                          <div className="mt-3">
                            <label className="text-sm font-medium text-gray-700 mr-2">Status:</label>
                            <select
                              value={gap.status}
                              onChange={(e) => handleUpdateGapStatus(gap.id, e.target.value as 'open' | 'filled' | 'suspended')}
                              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="open">Open</option>
                              <option value="filled">Filled</option>
                              <option value="suspended">Suspended</option>
                            </select>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {isOwner && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditGap(gap)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteGap(gap.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {!isOwner && (
                          isUserTagged(gap) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUntagSelf(gap.id)}
                            >
                              Untag Yourself
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleTagSelf(gap.id)}
                            >
                              Tag Yourself
                            </Button>
                          )
                        )}
                      </div>
                    </div>

                    {gap.gap_contributors.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Contributors ({gap.gap_contributors.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {gap.gap_contributors.map((contributor) => (
                            <Link
                              key={contributor.id}
                              href={`/profile/${contributor.user_id}`}
                              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200"
                            >
                              {contributor.profiles.username}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feature Suggestions Section */}
          <div className="mb-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200">
            <FeatureSuggestions projectId={project.id} />
          </div>

          {/* Feedback Section */}
          <div className="mb-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
            <h2 className="text-2xl font-bold text-green-900 mb-4 flex items-center">
              <MessageSquare className="h-6 w-6 mr-2 text-green-600" />
              Feedback
            </h2>
            <div className="space-y-6">
              <FeedbackForm
                projectId={project.id}
                onFeedbackAdded={() => setFeedbackRefresh(prev => prev + 1)}
              />
              <FeedbackList projectId={project.id} refreshTrigger={feedbackRefresh} />
            </div>
          </div>

          <div className="text-sm text-gray-500 text-center pt-4 border-t-2 border-gray-100">
            Created {new Date(project.created_at).toLocaleDateString()}
          </div>
        </div>

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

        <Dialog open={showGapDialog} onOpenChange={setShowGapDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGap?.id ? 'Edit Gap' : 'Add Gap'}</DialogTitle>
              <DialogDescription>
                Specify what kind of help you need for this project.
              </DialogDescription>
            </DialogHeader>
            {editingGap && (
              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gap Type *
                  </label>
                  <select
                    value={editingGap.gap_type}
                    onChange={(e) => setEditingGap({ ...editingGap, gap_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    {Object.entries(gapTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingGap.description}
                    onChange={(e) => setEditingGap({ ...editingGap, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Describe what kind of help you need..."
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowGapDialog(false)
                  setEditingGap(null)
                }}
                disabled={savingGap}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveGap} disabled={savingGap}>
                {savingGap ? 'Saving...' : 'Save Gap'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
