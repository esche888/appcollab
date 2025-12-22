'use client'

import Link from 'next/link'
import type { Project } from '@/types/database'
import { AlertCircle, Star } from 'lucide-react'
import { useState } from 'react'
import { UserProfileDialog } from '@/components/users/user-profile-dialog'

const statusColors = {
  draft: 'bg-slate-100 text-slate-700 border border-slate-200',
  idea: 'bg-appcollab-green-light/20 text-green-700 border border-appcollab-green-light/40',
  in_progress: 'bg-appcollab-teal/20 text-teal-700 border border-appcollab-teal/40',
  on_hold: 'bg-appcollab-orange/20 text-orange-700 border border-appcollab-orange/40',
  completed: 'bg-appcollab-green/20 text-green-700 border border-appcollab-green/40',
  archived: 'bg-amber-100 text-amber-700 border border-amber-200',
}

const statusLabels = {
  draft: 'Draft',
  idea: 'Idea',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  archived: 'Archived',
}

interface ProjectCardProps {
  project: Project & {
    open_gaps_count?: number
    is_favorited?: boolean
    owner_profiles?: Array<{ id: string; username: string; full_name: string | null }>
  }
  onFavoriteChange?: () => void
}

export function ProjectCard({ project, onFavoriteChange }: ProjectCardProps) {
  const [isFavorited, setIsFavorited] = useState(project.is_favorited || false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isUpdating) return

    setIsUpdating(true)
    try {
      const method = isFavorited ? 'DELETE' : 'POST'
      const response = await fetch(`/api/favorites/${project.id}`, { method })
      const result = await response.json()

      if (result.success) {
        setIsFavorited(!isFavorited)
        onFavoriteChange?.()
      }
    } catch (err) {
      console.error('Failed to update favorite:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-6 cursor-pointer border border-slate-200 hover:border-appcollab-teal group h-full flex flex-col relative">
        <button
          onClick={handleFavoriteClick}
          disabled={isUpdating}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-slate-100 transition-colors"
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star
            className={`h-5 w-5 transition-colors ${isFavorited
              ? 'fill-amber-400 text-amber-400'
              : 'text-slate-400 hover:text-amber-400'
              }`}
          />
        </button>
        <div className="flex justify-between items-start mb-3 gap-2 pr-8">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-appcollab-teal-dark transition-colors flex-1">{project.title}</h3>
          <div className="flex flex-col gap-2 items-end flex-shrink-0">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm whitespace-nowrap ${statusColors[project.status]}`}>
              {statusLabels[project.status]}
            </span>
            {(project.open_gaps_count ?? 0) > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold shadow-sm whitespace-nowrap bg-appcollab-orange/20 text-orange-700 border border-appcollab-orange/40 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {project.open_gaps_count} open gap{project.open_gaps_count! > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed flex-grow">
          {project.short_description}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100 mt-auto">
          <span className="font-medium">{new Date(project.created_at).toLocaleDateString()}</span>

          <span className="px-2 py-1 bg-gray-50 rounded-full font-medium flex items-center gap-1 z-20 relative stop-propagation-area" onClick={(e) => e.preventDefault()}>
            {project.owner_profiles && project.owner_profiles.length > 0
              ? project.owner_profiles.map((o, i) => (
                <span key={o.id}>
                  <UserProfileDialog userId={o.id} username={o.username}>
                    <span className="hover:text-blue-600 hover:underline cursor-pointer">
                      {o.username}
                    </span>
                  </UserProfileDialog>
                  {i < project.owner_profiles!.length - 1 && ', '}
                </span>
              ))
              : `${project.owner_ids.length} owner${project.owner_ids.length > 1 ? 's' : ''}`
            }
          </span>
        </div>
      </div>
    </Link>
  )
}
