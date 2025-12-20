import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: feedbackId } = await params

  // Fetch all comments for the feedback
  const { data, error } = await supabase
    .from('app_feedback_comments')
    .select(`
      *,
      profiles (id, username, full_name, avatar_url)
    `)
    .eq('app_feedback_id', feedbackId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

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
  const { id: feedbackId } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { content } = body

  if (!content || !content.trim()) {
    return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 })
  }

  // Check that feedback exists
  const { data: feedback } = await supabase
    .from('app_feedback')
    .select('id')
    .eq('id', feedbackId)
    .is('deleted_at', null)
    .single()

  if (!feedback) {
    return NextResponse.json({ success: false, error: 'Feedback not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('app_feedback_comments')
    .insert({
      app_feedback_id: feedbackId,
      user_id: user.id,
      content: content.trim(),
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
