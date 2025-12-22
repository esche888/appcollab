import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Project } from '@/types/database'
import { auditService } from '@/lib/audit/audit-service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_gaps (
        *,
        gap_contributors (
          *,
          profiles (id, username, full_name)
        )
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Check if project is draft and user is not owner
  const { data: { user } } = await supabase.auth.getUser()
  if (data?.status === 'draft') {
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    const isOwner = data.owner_ids.includes(user.id)

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden: Draft projects are only visible to owners' }, { status: 403 })
    }
  }

  // Filter out soft-deleted gaps and contributors
  if (data && data.project_gaps) {
    data.project_gaps = data.project_gaps
      .filter((gap: any) => !gap.deleted_at)
      .map((gap: any) => ({
        ...gap,
        gap_contributors: gap.gap_contributors?.filter((contributor: any) => !contributor.deleted_at) || []
      }))
  }

  return NextResponse.json({ success: true, data })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, short_description, full_description, website_url, github_url, status } = body

  // Check if user is owner and get current status
  const { data: project } = await supabase
    .from('projects')
    .select('owner_ids, status, title')
    .eq('id', id)
    .single()

  if (!project || !project.owner_ids.includes(user.id)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const oldStatus = project.status

  const { data, error } = await supabase
    .from('projects')
    .update({
      title,
      short_description,
      full_description,
      website_url,
      github_url,
      status,
    })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Log project update
  await auditService.logProjectAction(
    user.id,
    'project_updated',
    id,
    {
      title,
      status,
      oldStatus,
    }
  )

  // Log archiving if status changed to archived
  if (status === 'archived' && oldStatus !== 'archived') {
    await auditService.logProjectAction(
      user.id,
      'project_archived',
      id,
      {
        title,
      }
    )
  }

  // Log unarchiving if status changed from archived
  if (oldStatus === 'archived' && status !== 'archived') {
    await auditService.logProjectAction(
      user.id,
      'project_unarchived',
      id,
      {
        title,
        newStatus: status,
      }
    )
  }

  return NextResponse.json({ success: true, data: data as Project })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is owner and get project details
  const { data: project } = await supabase
    .from('projects')
    .select('owner_ids, title')
    .eq('id', id)
    .single()

  if (!project || !project.owner_ids.includes(user.id)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  // Soft delete
  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Log project deletion
  await auditService.logProjectAction(
    user.id,
    'project_deleted',
    id,
    {
      title: project.title,
    }
  )

  return NextResponse.json({ success: true })
}
