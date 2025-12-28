'use client'

import Link from 'next/link'
import Image from 'next/image'
import { UserPlus, FolderPlus, Lightbulb, MessageSquare, Clock } from 'lucide-react'
import type { AuditLog } from '@/types/database'

type EnrichedEvent = AuditLog & {
  profiles?: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
  project?: {
    id: string
    title: string
    logo_url: string | null
  }
}

interface EventCardProps {
  event: EnrichedEvent
}

const EVENT_CONFIG = {
  user_signup: {
    icon: UserPlus,
    color: 'text-green-600 bg-green-50',
    borderColor: 'border-green-200',
    getTitle: (event: EnrichedEvent) => 'New User Registered',
    getDescription: (event: EnrichedEvent) =>
      `${event.profiles?.full_name || event.profiles?.username || 'Someone'} joined the platform`
  },
  project_created: {
    icon: FolderPlus,
    color: 'text-blue-600 bg-blue-50',
    borderColor: 'border-blue-200',
    getTitle: (event: EnrichedEvent) => 'New Project Created',
    getDescription: (event: EnrichedEvent) =>
      `${event.profiles?.username || 'Someone'} created "${event.metadata?.project_title || 'a project'}"`
  },
  feature_suggestion_created: {
    icon: Lightbulb,
    color: 'text-yellow-600 bg-yellow-50',
    borderColor: 'border-yellow-200',
    getTitle: (event: EnrichedEvent) => {
      const title = event.metadata?.suggestion_title
      return title ? `New Feature Suggestion: ${title}` : 'New Feature Suggestion'
    },
    getDescription: (event: EnrichedEvent) =>
      `${event.profiles?.username || 'Someone'} suggested for ${event.project?.title || 'a project'}`
  },
  feedback_created: {
    icon: MessageSquare,
    color: 'text-purple-600 bg-purple-50',
    borderColor: 'border-purple-200',
    getTitle: (event: EnrichedEvent) => {
      const title = event.metadata?.feedback_title
      return title ? `New Feedback: ${title}` : 'New Feedback'
    },
    getDescription: (event: EnrichedEvent) =>
      `${event.profiles?.username || 'Someone'} provided feedback on ${event.project?.title || 'a project'}`
  }
}

export function EventCard({ event }: EventCardProps) {
  const config = EVENT_CONFIG[event.action_type as keyof typeof EVENT_CONFIG]

  if (!config) return null

  const Icon = config.icon
  const timeAgo = getTimeAgo(event.created_at)

  // Determine if this event should be clickable and where it should link
  const getEventLink = () => {
    const projectId = event.metadata?.project_id
    if (!projectId) return null

    switch (event.action_type) {
      case 'feature_suggestion_created':
        return `/projects/${projectId}#suggestions`
      case 'feedback_created':
        return `/projects/${projectId}#feedback`
      case 'project_created':
        return `/projects/${projectId}`
      default:
        return null
    }
  }

  const eventLink = getEventLink()
  const isClickable = eventLink !== null

  const cardContent = (
    <>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-3 rounded-full ${config.color}`}>
          <Icon className="h-6 w-6" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 break-words">{config.getTitle(event)}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {config.getDescription(event)}
              </p>
            </div>
            <div className="flex items-center text-xs text-gray-500 ml-4 whitespace-nowrap">
              <Clock className="h-3 w-3 mr-1" />
              {timeAgo}
            </div>
          </div>

          {/* Project and User badges */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Project badge */}
            {event.project && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                {event.project.logo_url && (
                  <Image
                    src={event.project.logo_url}
                    alt={event.project.title}
                    width={20}
                    height={20}
                    className="rounded"
                    unoptimized
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {event.project.title}
                </span>
              </div>
            )}

            {/* User badge */}
            {event.profiles && (
              <div className="flex items-center gap-2">
                {event.profiles.avatar_url && (
                  <Image
                    src={event.profiles.avatar_url}
                    alt={event.profiles.username}
                    width={24}
                    height={24}
                    className="rounded-full"
                    unoptimized
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <span className="text-sm text-gray-600">
                  @{event.profiles.username}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )

  // If clickable, wrap in Link, otherwise just return the div
  if (isClickable && eventLink) {
    return (
      <Link href={eventLink}>
        <div className={`bg-white rounded-lg p-4 border ${config.borderColor} shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-opacity-100`}>
          {cardContent}
        </div>
      </Link>
    )
  }

  return (
    <div className={`bg-white rounded-lg p-4 border ${config.borderColor} shadow-sm`}>
      {cardContent}
    </div>
  )
}

function getTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString()
}
