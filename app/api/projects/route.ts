import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Project } from '@/types/database'
import { auditService } from '@/lib/audit/audit-service'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const userId = searchParams.get('userId')
  const includeArchived = searchParams.get('includeArchived') === 'true'
  const favoritesOnly = searchParams.get('favoritesOnly') === 'true'

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Get user profile to check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  let query = supabase
    .from('projects')
    .select(`
      *,
      project_gaps (
        id,
        status,
        deleted_at
      )
    `)
    .is('deleted_at', null)

  // Handle archived projects visibility
  if (!includeArchived) {
    // By default, exclude archived projects
    query = query.neq('status', 'archived')
  } else {
    // If includeArchived is true, apply visibility rules:
    // - Admins see all archived projects
    // - Regular users only see their own archived projects
    if (!isAdmin && userId) {
      // User viewing their own projects with archived included
      query = query.contains('owner_ids', [userId])
    } else if (!isAdmin) {
      // Regular user trying to see all projects with archived - exclude archived
      query = query.neq('status', 'archived')
    }
    // If admin, no additional filtering needed - they see all
  }

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (userId) {
    query = query.contains('owner_ids', [userId])
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Get user's favorited project IDs
  const { data: favorites } = await supabase
    .from('favorite_projects')
    .select('project_id')
    .eq('user_id', user.id)

  const favoritedProjectIds = new Set(favorites?.map(f => f.project_id) || [])

  // Filter by favorites if requested
  let filteredData = data
  if (favoritesOnly) {
    filteredData = data?.filter((project: any) => favoritedProjectIds.has(project.id))
  }

  // Add open gaps count and is_favorited to each project
  const projectsWithMetadata = filteredData?.map((project: any) => {
    const openGapsCount = project.project_gaps?.filter(
      (gap: any) => !gap.deleted_at && gap.status === 'open'
    ).length || 0

    return {
      ...project,
      open_gaps_count: openGapsCount,
      is_favorited: favoritedProjectIds.has(project.id),
    }
  })

  return NextResponse.json({ success: true, data: projectsWithMetadata as Project[] })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, short_description, full_description, website_url, github_url, status, gaps } = body

  // Create project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      title,
      short_description,
      full_description,
      website_url,
      github_url,
      owner_ids: [user.id],
      status: status || 'idea',
    })
    .select()
    .single()

  if (projectError) {
    return NextResponse.json({ success: false, error: projectError.message }, { status: 500 })
  }

  // Log project creation
  await auditService.logProjectAction(
    user.id,
    'project_created',
    project.id,
    {
      title: project.title,
      status: project.status,
    }
  )

  // Create gaps if provided
  if (gaps && gaps.length > 0) {
    const gapsToInsert = gaps.map((gap: { gap_type: string; description?: string }) => ({
      project_id: project.id,
      gap_type: gap.gap_type,
      description: gap.description || null,
      status: 'open',
    }))

    const { error: gapsError } = await supabase
      .from('project_gaps')
      .insert(gapsToInsert)

    if (gapsError) {
      console.error('Error creating gaps:', gapsError)
    }
  }

  return NextResponse.json({ success: true, data: project as Project })
}
