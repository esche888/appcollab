import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: projectId } = await params

  // Fetch all feedback for the project
  const { data, error } = await supabase
    .from('feedback')
    .select(`
      *,
      profiles (id, username, full_name, avatar_url)
    `)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Organize into threads (top-level comments and their replies)
  const topLevel = data.filter((f: any) => !f.parent_id)
  const threaded = topLevel.map((parent: any) => ({
    ...parent,
    replies: data.filter((f: any) => f.parent_id === parent.id)
  }))

  return NextResponse.json({ success: true, data: threaded })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: projectId } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { content, ai_enhanced, parent_id, title } = body

  // Validate: top-level comments must have a title
  if (!parent_id && !title) {
    return NextResponse.json({ success: false, error: 'Title is required for new feedback threads' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('feedback')
    .insert({
      project_id: projectId,
      user_id: user.id,
      title: parent_id ? null : title, // Only set title for top-level comments
      content,
      ai_enhanced: ai_enhanced || false,
      parent_id: parent_id || null,
    })
    .select(`
      *,
      profiles (id, username, full_name, avatar_url)
    `)
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
