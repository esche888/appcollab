'use client'

import Link from 'next/link'
import type { Project } from '@/types/database'
import { AlertCircle, Star } from 'lucide-react'
import { useState } from 'react'

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  idea: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-blue-100 text-blue-800',
  on_hold: 'bg-gray-100 text-gray-800',
  completed: 'bg-green-100 text-green-800',
  archived: 'bg-orange-100 text-orange-800',
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
  project: Project & { open_gaps_count?: number; is_favorited?: boolean }
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
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-6 cursor-pointer border border-gray-100 hover:border-blue-200 group h-full flex flex-col relative">
        <button
          onClick={handleFavoriteClick}
          disabled={isUpdating}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              isFavorited
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-400 hover:text-yellow-400'
            }`}
          />
        </button>
        <div className="flex justify-between items-start mb-3 gap-2 pr-8">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex-1">{project.title}</h3>
          <div className="flex flex-col gap-2 items-end flex-shrink-0">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm whitespace-nowrap ${statusColors[project.status]}`}>
              {statusLabels[project.status]}
            </span>
            {(project.open_gaps_count ?? 0) > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold shadow-sm whitespace-nowrap bg-yellow-100 text-yellow-800 flex items-center gap-1">
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
          <span className="px-2 py-1 bg-gray-50 rounded-full font-medium">{project.owner_ids.length} owner{project.owner_ids.length > 1 ? 's' : ''}</span>
        </div>
      </div>
    </Link>
  )
}
