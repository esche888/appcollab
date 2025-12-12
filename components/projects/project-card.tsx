import Link from 'next/link'
import type { Project } from '@/types/database'

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

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
            {statusLabels[project.status]}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.short_description}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{new Date(project.created_at).toLocaleDateString()}</span>
          <span>{project.owner_ids.length} owner{project.owner_ids.length > 1 ? 's' : ''}</span>
        </div>
      </div>
    </Link>
  )
}
