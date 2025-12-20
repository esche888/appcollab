import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: bestPracticeId } = await params

  // Fetch all comments for the best practice
  const { data, error } = await supabase
    .from('best_practice_comments')
    .select(`
      *,
      profiles (id, username, full_name, avatar_url)
    `)
    .eq('best_practice_id', bestPracticeId)
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
  const { id: bestPracticeId } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { content } = body

  if (!content || !content.trim()) {
    return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 })
  }

  // Check that best practice exists and is published
  const { data: bestPractice } = await supabase
    .from('best_practices')
    .select('status')
    .eq('id', bestPracticeId)
    .is('deleted_at', null)
    .single()

  if (!bestPractice) {
    return NextResponse.json({ success: false, error: 'Best practice not found' }, { status: 404 })
  }

  if (bestPractice.status !== 'published') {
    return NextResponse.json(
      { success: false, error: 'Can only comment on published best practices' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('best_practice_comments')
    .insert({
      best_practice_id: bestPracticeId,
      user_id: user.id,
      content,
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
