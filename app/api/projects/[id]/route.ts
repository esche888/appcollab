import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Project } from '@/types/database'

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
  const { title, short_description, full_description, status } = body

  // Check if user is owner
  const { data: project } = await supabase
    .from('projects')
    .select('owner_ids')
    .eq('id', id)
    .single()

  if (!project || !project.owner_ids.includes(user.id)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('projects')
    .update({
      title,
      short_description,
      full_description,
      status,
    })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
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

  // Check if user is owner
  const { data: project } = await supabase
    .from('projects')
    .select('owner_ids')
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

  return NextResponse.json({ success: true })
}
