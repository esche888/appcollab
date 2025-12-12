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
}

export type Project = {
  id: string
  title: string
  short_description: string
  full_description: string | null
  owner_ids: string[]
  status: 'idea' | 'in_progress' | 'seeking_help' | 'on_hold' | 'completed'
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
