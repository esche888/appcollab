export type NotificationPreferences = {
  notify_feature_suggestion_added: boolean
  notify_feature_suggestion_comment_added: boolean
  notify_feedback_added: boolean
  notify_feedback_comment_added: boolean
}

export type Profile = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
  skills: string[]
  bio: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  project_filters?: Record<string, any>
  best_practice_filters?: Record<string, any>
  event_filters?: Record<string, any>
  notification_preferences?: NotificationPreferences
}

export type Project = {
  id: string
  title: string
  short_description: string
  full_description: string | null
  website_url: string | null
  github_url: string | null
  logo_url: string | null
  owner_ids: string[]
  status: 'draft' | 'idea' | 'in_progress' | 'on_hold' | 'completed' | 'archived'
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ProjectGap = {
  id: string
  project_id: string
  gap_type: 'idea_assessment' | 'ux_design' | 'development' | 'deployment' | 'commercialization' | 'marketing'
  description: string | null
  is_filled: boolean
  status: 'open' | 'filled' | 'suspended'
  created_at: string
  deleted_at: string | null
}

export type GapContributor = {
  id: string
  gap_id: string
  user_id: string
  status: 'interested' | 'helping' | 'completed'
  created_at: string
  deleted_at: string | null
}

export type Feedback = {
  id: string
  project_id: string
  user_id: string
  parent_id: string | null
  title: string | null
  content: string
  ai_enhanced: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type FeatureSuggestion = {
  id: string
  project_id: string
  user_id: string
  title: string
  description: string
  upvotes: number
  status: 'pending' | 'accepted' | 'rejected' | 'implemented'
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type FeatureSuggestionComment = {
  id: string
  suggestion_id: string
  user_id: string
  parent_id: string | null
  content: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type FeatureSuggestionCommentVote = {
  id: string
  comment_id: string
  user_id: string
  vote_type: 'up' | 'down'
  created_at: string
  updated_at: string
}

export type FeatureSuggestionCommentWithDetails = FeatureSuggestionComment & {
  profiles: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
  replies?: FeatureSuggestionCommentWithDetails[]
  votes?: {
    upvotes: number
    downvotes: number
    userVote: 'up' | 'down' | null
  }
}

export type BestPractice = {
  id: string
  user_id: string
  title: string
  description: string
  category: 'architecture' | 'development' | 'testing' | 'deployment' | 'security' |
  'ux_design' | 'performance' | 'documentation' | 'collaboration' |
  'project_management' | 'other'
  upvotes: number
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type BestPracticeRequest = {
  id: string
  user_id: string
  title: string
  description: string
  upvotes: number
  status: 'open' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type BestPracticeComment = {
  id: string
  best_practice_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type AppFeedback = {
  id: string
  user_id: string
  title: string
  description: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type AppFeedbackComment = {
  id: string
  app_feedback_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type FavoriteProject = {
  id: string
  user_id: string
  project_id: string
  created_at: string
}

// Common skill types for hackathon projects
export const COMMON_SKILLS = [
  'Idea Assessment',
  'UX Design',
  'UI Design',
  'Frontend Development',
  'Backend Development',
  'Full Stack Development',
  'Mobile Development',
  'iOS Development',
  'Android Development',
  'Web Development',
  'API Development',
  'Database Design',
  'DevOps',
  'Cloud Architecture',
  'Product Management',
  'Project Management',
  'Marketing',
  'Content Writing',
  'Copywriting',
  'Business Strategy',
  'Commercialization',
  'Pitching',
  'Presentation',
  'Graphic Design',
  'Video Editing',
  'Data Analysis',
  'Machine Learning',
  'AI/ML',
  'Blockchain',
  'Game Development',
  'QA/Testing',
] as const

export type SkillType = typeof COMMON_SKILLS[number]

// Best practice categories
export const BEST_PRACTICE_CATEGORIES = [
  { value: 'architecture', label: 'Architecture' },
  { value: 'development', label: 'Development' },
  { value: 'testing', label: 'Testing & QA' },
  { value: 'deployment', label: 'Deployment & CI/CD' },
  { value: 'security', label: 'Security' },
  { value: 'ux_design', label: 'UX/UI Design' },
  { value: 'performance', label: 'Performance' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'project_management', label: 'Project Management' },
  { value: 'other', label: 'Other' },
] as const

// Audit log types
export const AUDIT_ACTION_TYPES = [
  'project_created',
  'project_updated',
  'project_deleted',
  'project_archived',
  'project_unarchived',
  'user_created',
  'user_role_changed',
  'user_deleted',
  'user_login',
  'user_logout',
  'user_signup',
  'ai_settings_changed',
  'admin_settings_changed',
  'feature_suggestion_created',
  'feature_suggestion_status_changed',
  'feedback_created',
  'feedback_comment_created',
] as const

export type AuditActionType = typeof AUDIT_ACTION_TYPES[number]

// Event categories for filtering
export const EVENT_CATEGORIES = {
  'user-related': ['user_signup'],
  'project-related': [
    'project_created',
    'feature_suggestion_created',
    'feedback_created'
  ]
} as const

export type EventCategory = keyof typeof EVENT_CATEGORIES

export type AuditLog = {
  id: string
  user_id: string | null
  action_type: AuditActionType
  resource_type: 'project' | 'user' | 'auth' | 'settings' | null
  resource_id: string | null
  metadata: Record<string, any>
  created_at: string
}
