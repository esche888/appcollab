import { createClient as createServerClient } from '@/lib/supabase/server'
import type { Project, ProjectGap } from '@/types/database'

export async function getAllProjects() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }

  return data as Project[]
}

export async function getProject(projectId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('Error fetching project:', error)
    return null
  }

  return data as Project
}

export async function getProjectGaps(projectId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('project_gaps')
    .select(`
      *,
      gap_contributors (
        *,
        profiles (username, full_name)
      )
    `)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching project gaps:', error)
    return []
  }

  return data
}

export async function getUserProjects(userId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .contains('owner_ids', [userId])
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user projects:', error)
    return []
  }

  return data as Project[]
}
