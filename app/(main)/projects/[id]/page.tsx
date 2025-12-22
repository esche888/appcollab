'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, AlertCircle, MessageSquare, Edit, Plus, X, ExternalLink, Github, ChevronDown, ChevronUp, Lightbulb, FileText, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { FeedbackForm } from '@/components/feedback/feedback-form'
import { FeedbackList } from '@/components/feedback/feedback-list'
import { FeatureSuggestions } from '@/components/projects/feature-suggestions'
import { AIAssistantModal } from '@/components/projects/ai-assistant-modal'
import { UserProfileDialog } from '@/components/users/user-profile-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type ProjectWithGaps = {
  id: string
  title: string
  short_description: string
  full_description: string | null
  website_url: string | null
  github_url: string | null
  owner_ids: string[]
  status: string
  created_at: string
  owner_profiles?: Array<{
    id: string
    username: string
    full_name: string | null
  }>
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
  const [showGapDialog, setShowGapDialog] = useState(false)
  const [editingGap, setEditingGap] = useState<{ id?: string; gap_type: string; description: string } | null>(null)
  const [savingGap, setSavingGap] = useState(false)
  const [isHelpNeededExpanded, setIsHelpNeededExpanded] = useState(false)
  const [isFeatureSuggestionsExpanded, setIsFeatureSuggestionsExpanded] = useState(false)
  const [isFeedbackExpanded, setIsFeedbackExpanded] = useState(false)
  const [isUpdatesExpanded, setIsUpdatesExpanded] = useState(false)
  const [showFeatureForm, setShowFeatureForm] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [projectUpdates, setProjectUpdates] = useState<Array<{ id: string; content: string; created_at: string }>>([])
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [newUpdateContent, setNewUpdateContent] = useState('')
  const [submittingUpdate, setSubmittingUpdate] = useState(false)

  const loadUpdates = async () => {
    const response = await fetch(`/api/projects/${params.id}/updates`)
    const result = await response.json()
    if (result.success) {
      setProjectUpdates(result.data)
    }
  }

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

      // Load project updates
      await loadUpdates()

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

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUpdateContent.trim()) return

    setSubmittingUpdate(true)
    try {
      const response = await fetch(`/api/projects/${params.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newUpdateContent }),
      })

      const result = await response.json()

      if (result.success) {
        setNewUpdateContent('')
        setShowUpdateForm(false)
        await loadUpdates()
      } else {
        alert(result.error || 'Failed to add update')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add update')
    } finally {
      setSubmittingUpdate(false)
    }
  }

  const handleDeleteUpdate = async (updateId: string) => {
    if (!confirm('Are you sure you want to delete this update?')) return

    try {
      const response = await fetch(`/api/projects/${params.id}/updates/${updateId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        await loadUpdates()
      } else {
        alert(result.error || 'Failed to delete update')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete update')
    }
  }

  if (loading) {
    return (
      <div className="p-8 min-h-screen bg-gradient-to-br from-appcollab-teal/10 via-appcollab-blue/10 to-appcollab-green-light/10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-blue-100">
            <p className="text-gray-600 text-lg">Loading project...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-8 min-h-screen bg-gradient-to-br from-appcollab-teal/10 via-appcollab-blue/10 to-appcollab-green-light/10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-red-200">
            <p className="text-red-600 text-lg font-semibold">Project not found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-appcollab-teal/10 via-appcollab-blue/10 to-appcollab-green-light/10">
      <div className="max-w-6xl mx-auto">


        {/* Project Header */}
        <div className="bg-gradient-to-r from-appcollab-teal-dark to-appcollab-blue-dark rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-4xl font-bold text-white flex-1 mr-4">{project.title}</h1>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[project.status as keyof typeof statusColors]} shadow-md`}>
                {statusLabels[project.status as keyof typeof statusLabels]}
              </span>
              <AIAssistantModal project={project} />
              {isOwner && (
                <Link href={`/projects/${project.id}/edit`}>
                  <Button className="bg-white text-blue-600 hover:bg-blue-50" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <p className="text-lg text-blue-100 mb-4">{project.short_description}</p>
          {project.owner_profiles && project.owner_profiles.length > 0 && (
            <div className="mb-4">
              <span className="text-sm text-blue-200 mr-2">Project Owner{project.owner_profiles.length > 1 ? 's' : ''}:</span>
              {project.owner_profiles.map((owner, index) => (
                <span key={owner.id}>
                  <UserProfileDialog userId={owner.id} username={owner.username}>
                    <span className="text-sm text-white font-medium hover:text-blue-100 hover:underline cursor-pointer">
                      {owner.username}
                    </span>
                  </UserProfileDialog>
                  {index < project.owner_profiles!.length - 1 && <span className="text-blue-200">, </span>}
                </span>
              ))}
            </div>
          )}
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

        <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-100">

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
              <h2 className="text-2xl font-bold bg-gradient-to-r from-appcollab-teal-dark to-appcollab-blue-dark bg-clip-text text-transparent mb-3">About This Project</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{project.full_description}</p>
            </div>
          )}

          {/* Help Needed Section */}
          <div className="mb-8 bg-gradient-to-br from-appcollab-orange/10 to-appcollab-orange/20 rounded-xl p-6 border-2 border-appcollab-orange/30">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setIsHelpNeededExpanded(!isHelpNeededExpanded)}
                className="flex items-center text-2xl font-bold text-orange-900 hover:text-orange-700 transition-colors"
              >
                <AlertCircle className="h-6 w-6 mr-2 text-appcollab-orange" />
                Help Needed
                <span className="ml-2 bg-white/50 px-2 py-0.5 rounded-full text-sm font-medium">
                  {project.project_gaps.filter(g => g.status === 'open').length}
                </span>
                {isHelpNeededExpanded ? (
                  <ChevronUp className="h-5 w-5 ml-2" />
                ) : (
                  <ChevronDown className="h-5 w-5 ml-2" />
                )}
              </button>
              {isOwner && isHelpNeededExpanded && (
                <Button size="sm" onClick={handleAddGap} className="bg-appcollab-orange hover:bg-appcollab-orange/80 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Gap
                </Button>
              )}
            </div>

            {isHelpNeededExpanded && (
              project.project_gaps.length === 0 ? (
                <p className="text-orange-800 font-medium">No specific help needed at the moment.</p>
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
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${gap.status === 'filled' ? 'bg-green-100 text-green-800' :
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
              )
            )}
          </div>

          {/* Feature Suggestions Section */}
          <div className="mb-8 bg-gradient-to-br from-appcollab-green-light/10 to-appcollab-green/20 rounded-xl p-6 border-2 border-appcollab-green-light/30">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setIsFeatureSuggestionsExpanded(!isFeatureSuggestionsExpanded)}
                className="flex items-center text-2xl font-bold text-green-900 hover:text-green-700 transition-colors"
              >
                <Lightbulb className="h-6 w-6 mr-2 text-appcollab-green-light" />
                Feature Suggestions
                {isFeatureSuggestionsExpanded ? (
                  <ChevronUp className="h-5 w-5 ml-2" />
                ) : (
                  <ChevronDown className="h-5 w-5 ml-2" />
                )}
              </button>
              {isFeatureSuggestionsExpanded && (
                <Button size="sm" onClick={() => setShowFeatureForm(!showFeatureForm)} className="bg-green-900 hover:bg-green-800 text-white">
                  {showFeatureForm ? 'Cancel' : 'Suggest Feature'}
                </Button>
              )}
            </div>
            {isFeatureSuggestionsExpanded && (
              <FeatureSuggestions
                projectId={project.id}
                showForm={showFeatureForm}
                setShowForm={setShowFeatureForm}
                isOwner={isOwner || false}
                currentUserId={userId}
              />
            )}
          </div>

          {/* Feedback Section */}
          <div className="mb-8 bg-gradient-to-br from-appcollab-teal/10 to-appcollab-teal-dark/20 rounded-xl p-6 border-2 border-appcollab-teal/30">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setIsFeedbackExpanded(!isFeedbackExpanded)}
                className="flex items-center text-2xl font-bold text-teal-900 hover:text-teal-700 transition-colors"
              >
                <MessageSquare className="h-6 w-6 mr-2 text-appcollab-teal" />
                Feedback
                {isFeedbackExpanded ? (
                  <ChevronUp className="h-5 w-5 ml-2" />
                ) : (
                  <ChevronDown className="h-5 w-5 ml-2" />
                )}
              </button>
              {isFeedbackExpanded && (
                <Button size="sm" onClick={() => setShowFeedbackForm(!showFeedbackForm)} className="bg-teal-900 hover:bg-teal-800 text-white">
                  {showFeedbackForm ? 'Cancel' : 'Add Feedback'}
                </Button>
              )}
            </div>
            {isFeedbackExpanded && (
              <div className="space-y-6">
                <FeedbackForm
                  projectId={project.id}
                  onFeedbackAdded={() => setFeedbackRefresh(prev => prev + 1)}
                  isExpanded={showFeedbackForm}
                  setIsExpanded={setShowFeedbackForm}
                />
                <FeedbackList projectId={project.id} refreshTrigger={feedbackRefresh} />
              </div>
            )}
          </div>

          {/* Project Updates Section */}
          <div className="mb-8 bg-gradient-to-br from-appcollab-blue/10 to-appcollab-blue-dark/20 rounded-xl p-6 border-2 border-appcollab-blue/30">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setIsUpdatesExpanded(!isUpdatesExpanded)}
                className="flex items-center text-2xl font-bold text-blue-900 hover:text-blue-700 transition-colors"
              >
                <FileText className="h-6 w-6 mr-2 text-appcollab-blue" />
                Project Updates
                {isUpdatesExpanded ? (
                  <ChevronUp className="h-5 w-5 ml-2" />
                ) : (
                  <ChevronDown className="h-5 w-5 ml-2" />
                )}
              </button>
              {isOwner && isUpdatesExpanded && (
                <Button
                  size="sm"
                  onClick={() => setShowUpdateForm(!showUpdateForm)}
                  className="bg-appcollab-blue hover:bg-appcollab-blue-dark text-white"
                >
                  {showUpdateForm ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Update
                    </>
                  )}
                </Button>
              )}
            </div>

            {isUpdatesExpanded && (
              <div className="space-y-4">
                {isOwner && showUpdateForm && (
                  <form onSubmit={handleSubmitUpdate} className="bg-white rounded-lg p-4 border border-blue-200 shadow-md">
                    <div className="mb-3">
                      <label htmlFor="update-content" className="block text-sm font-medium text-gray-700 mb-1">
                        Update Content
                      </label>
                      <textarea
                        id="update-content"
                        rows={4}
                        required
                        value={newUpdateContent}
                        onChange={(e) => setNewUpdateContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Share recent changes, progress, or announcements about the project..."
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={submittingUpdate}>
                        {submittingUpdate ? 'Posting...' : 'Post Update'}
                      </Button>
                    </div>
                  </form>
                )}

                {projectUpdates.length === 0 ? (
                  <p className="text-blue-900 font-medium">No updates yet.</p>
                ) : (
                  <div className="space-y-3">
                    {projectUpdates.map((update) => (
                      <div key={update.id} className="bg-white rounded-lg p-4 border border-blue-200 shadow-md">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-gray-700 whitespace-pre-wrap">{update.content}</p>
                            <p className="text-sm text-gray-500 mt-2">
                              {new Date(update.created_at).toLocaleDateString()} at {new Date(update.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                          {isOwner && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUpdate(update.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-sm text-gray-500 text-center pt-4 border-t-2 border-gray-100">
            Created {new Date(project.created_at).toLocaleDateString()}
          </div>
        </div>

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
