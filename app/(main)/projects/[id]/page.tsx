'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, AlertCircle, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { FeedbackForm } from '@/components/feedback/feedback-form'
import { FeedbackList } from '@/components/feedback/feedback-list'
import { FeatureSuggestions } from '@/components/projects/feature-suggestions'

type ProjectWithGaps = {
  id: string
  title: string
  short_description: string
  full_description: string | null
  owner_ids: string[]
  status: string
  created_at: string
  project_gaps: Array<{
    id: string
    gap_type: string
    description: string | null
    is_filled: boolean
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
  seeking_help: 'bg-yellow-100 text-yellow-800',
  on_hold: 'bg-gray-100 text-gray-800',
  completed: 'bg-green-100 text-green-800',
}

const statusLabels = {
  idea: 'Idea',
  in_progress: 'In Progress',
  seeking_help: 'Seeking Help',
  on_hold: 'On Hold',
  completed: 'Completed',
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
  const [feedbackRefresh, setFeedbackRefresh] = useState(0)

  useEffect(() => {
    async function loadProject() {
      const response = await fetch(`/api/projects/${params.id}`)
      const result = await response.json()

      if (result.success) {
        setProject(result.data)
      }

      // Get current user ID
      const profileResponse = await fetch('/api/profile')
      const profileResult = await profileResponse.json()
      if (profileResult.success) {
        setUserId(profileResult.data.id)
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <p>Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <p>Project not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/projects" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{project.title}</h1>
              <p className="text-lg text-gray-600">{project.short_description}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[project.status as keyof typeof statusColors]}`}>
              {statusLabels[project.status as keyof typeof statusLabels]}
            </span>
          </div>

          {project.full_description && (
            <div className="mb-8 pb-8 border-b">
              <h2 className="text-xl font-semibold mb-3">About This Project</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{project.full_description}</p>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Help Needed
            </h2>

            {project.project_gaps.length === 0 ? (
              <p className="text-gray-600">No specific help needed at the moment.</p>
            ) : (
              <div className="space-y-4">
                {project.project_gaps.map((gap) => (
                  <div key={gap.id} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {gapTypeLabels[gap.gap_type]}
                        </h3>
                        {gap.description && (
                          <p className="text-gray-600">{gap.description}</p>
                        )}
                      </div>
                      {isUserTagged(gap) ? (
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
                      )}
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

          <div className="mb-8">
            <FeatureSuggestions projectId={project.id} />
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
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

          <div className="text-sm text-gray-500">
            Created {new Date(project.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}
