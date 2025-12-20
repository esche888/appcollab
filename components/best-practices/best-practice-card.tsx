import Link from 'next/link'
import { ThumbsUp } from 'lucide-react'
import type { BestPractice } from '@/types/database'
import { CategoryBadge } from './category-badge'

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-orange-100 text-orange-800',
}

const statusLabels = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
}

interface BestPracticeCardProps {
  bestPractice: BestPractice & {
    profiles?: {
      id: string
      username: string
      full_name: string | null
    }
  }
}

export function BestPracticeCard({ bestPractice }: BestPracticeCardProps) {
  const authorName = bestPractice.profiles?.full_name || bestPractice.profiles?.username || 'Unknown'

  return (
    <Link href={`/best-practices/${bestPractice.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer h-full flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-gray-900 flex-1">{bestPractice.title}</h3>
          {bestPractice.status !== 'published' && (
            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${statusColors[bestPractice.status]}`}>
              {statusLabels[bestPractice.status]}
            </span>
          )}
        </div>

        <div className="mb-3">
          <CategoryBadge category={bestPractice.category} />
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
          {bestPractice.description}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <ThumbsUp className="h-3 w-3 mr-1" />
              {bestPractice.upvotes}
            </span>
            <span>by {authorName}</span>
          </div>
          <span>{new Date(bestPractice.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  )
}
