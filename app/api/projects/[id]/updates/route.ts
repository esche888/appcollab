import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('project_updates')
    .select('*')
    .eq('project_id', id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user is a project owner
  const { data: project } = await supabase
    .from('projects')
    .select('owner_ids')
    .eq('id', id)
    .single()

  if (!project || !project.owner_ids.includes(user.id)) {
    return NextResponse.json({ success: false, error: 'Only project owners can add updates' }, { status: 403 })
  }

  const body = await request.json()
  const { content } = body

  if (!content || !content.trim()) {
    return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('project_updates')
    .insert({
      project_id: id,
      user_id: user.id,
      content,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
