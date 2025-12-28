import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { AuditLog } from '@/types/database'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  // Extract query parameters
  const category = searchParams.get('category') // 'all' | 'user-related' | 'project-related'
  const projectId = searchParams.get('projectId') // Filter by specific project
  const timeRange = searchParams.get('timeRange') || '30d' // '24h' | '7d' | '30d' | 'all'
  const favoritesOnly = searchParams.get('favoritesOnly') === 'true'
  const contributingOnly = searchParams.get('contributingOnly') === 'true'
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 50

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Build base query - join with profiles for user data
  let query = supabase
    .from('audit_logs')
    .select(`
      id,
      user_id,
      action_type,
      resource_type,
      resource_id,
      metadata,
      created_at,
      profiles:user_id (
        id,
        username,
        full_name,
        avatar_url
      )
    `, { count: 'exact' })

  // Filter by event category
  if (category && category !== 'all') {
    const EVENT_CATEGORIES = {
      'user-related': ['user_signup'],
      'project-related': ['project_created', 'feature_suggestion_created', 'feedback_created']
    }
    const actionTypes = EVENT_CATEGORIES[category as keyof typeof EVENT_CATEGORIES]
    if (actionTypes) {
      query = query.in('action_type', actionTypes)
    }
  } else {
    // Default: show all user-facing events
    query = query.in('action_type', [
      'user_signup',
      'project_created',
      'feature_suggestion_created',
      'feedback_created'
    ])
  }

  // Filter by time range
  if (timeRange !== 'all') {
    const now = new Date()
    const timeRangeMap: Record<string, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }
    const milliseconds = timeRangeMap[timeRange]
    if (milliseconds) {
      const startDate = new Date(now.getTime() - milliseconds)
      query = query.gte('created_at', startDate.toISOString())
    }
  }

  // Filter by specific project
  if (projectId && projectId !== 'all') {
    query = query.eq('metadata->>project_id', projectId)
  }

  // Get user's favorite projects if needed
  let favoriteProjectIds: string[] = []
  if (favoritesOnly) {
    const { data: favorites } = await supabase
      .from('favorite_projects')
      .select('project_id')
      .eq('user_id', user.id)
    favoriteProjectIds = favorites?.map(f => f.project_id) || []
  }

  // Get projects user is contributing to if needed
  let contributingProjectIds: string[] = []
  if (contributingOnly) {
    const { data: contributions } = await supabase
      .from('gap_contributors')
      .select('gap_id, project_gaps!inner(project_id)')
      .eq('user_id', user.id)
      .is('deleted_at', null)

    contributingProjectIds = contributions?.map((c: any) =>
      c.project_gaps?.project_id
    ).filter(Boolean) || []
  }

  // Apply favorites/contributing filter
  const filterProjectIds = [
    ...(favoritesOnly ? favoriteProjectIds : []),
    ...(contributingOnly ? contributingProjectIds : [])
  ]

  if (filterProjectIds.length > 0) {
    // Filter events to only those projects
    const uniqueProjectIds = [...new Set(filterProjectIds)]
    // Use OR condition to match any of the metadata->project_id values
    const orConditions = uniqueProjectIds.map(id => `metadata->>project_id.eq.${id}`).join(',')
    query = query.or(orConditions)
  } else if (favoritesOnly || contributingOnly) {
    // User has no favorites/contributions, return empty
    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
      page,
      pageSize
    })
  }

  // Order and paginate
  query = query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const { data: events, count, error } = await query

  if (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Enrich events with project data
  const enrichedEvents = await Promise.all(
    (events || []).map(async (event: any) => {
      const projectId = event.metadata?.project_id

      if (projectId) {
        const { data: project } = await supabase
          .from('projects')
          .select('id, title, logo_url')
          .eq('id', projectId)
          .single()

        return {
          ...event,
          project
        }
      }

      return event
    })
  )

  return NextResponse.json({
    success: true,
    data: enrichedEvents,
    count: count || 0,
    page,
    pageSize
  })
}
