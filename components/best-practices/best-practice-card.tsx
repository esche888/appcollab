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

import { UserProfileDialog } from '@/components/users/user-profile-dialog'

export function BestPracticeCard({ bestPractice }: BestPracticeCardProps) {
  const authorName = bestPractice.profiles?.username || bestPractice.profiles?.full_name || 'Unknown'

  return (
    <div className="group h-full block relative">
      <Link href={`/best-practices/${bestPractice.id}`} className="block h-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 hover:border-appcollab-teal hover:shadow-md transition-all p-6 h-full flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-appcollab-teal-dark transition-colors flex-1">{bestPractice.title}</h3>
            {bestPractice.status !== 'published' && (
              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${statusColors[bestPractice.status]}`}>
                {statusLabels[bestPractice.status]}
              </span>
            )}
          </div>

          <div className="mb-3">
            <CategoryBadge category={bestPractice.category} />
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed flex-1">
            {bestPractice.description}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-50 mt-auto">
            <div className="flex items-center space-x-4">
              <span className="flex items-center group-hover:text-appcollab-orange transition-colors">
                <ThumbsUp className="h-3 w-3 mr-1" />
                {bestPractice.upvotes}
              </span>
              <div className="flex items-center gap-1 stop-propagation-area" onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}>
                <span>by </span>
                {bestPractice.profiles?.id ? (
                  <UserProfileDialog userId={bestPractice.profiles.id} username={authorName}>
                    <span className="font-medium hover:text-blue-600 hover:underline cursor-pointer">
                      {authorName}
                    </span>
                  </UserProfileDialog>
                ) : (
                  <span>{authorName}</span>
                )}
              </div>
            </div>
            <span className="text-gray-400">{new Date(bestPractice.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </Link>
    </div>
  )
}
