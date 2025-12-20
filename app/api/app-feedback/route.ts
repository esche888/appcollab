import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { AppFeedback } from '@/types/database'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const sort = searchParams.get('sort') || 'newest' // 'newest' or 'oldest'

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let query = supabase
    .from('app_feedback')
    .select('*, profiles(id, username, full_name, avatar_url)')
    .is('deleted_at', null)

  // Filter by user if specified
  if (userId) {
    query = query.eq('user_id', userId)
  }

  // Sort
  if (sort === 'oldest') {
    query = query.order('created_at', { ascending: true })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data as AppFeedback[] })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, description } = body

  // Validate required fields
  if (!title || !description) {
    return NextResponse.json(
      { success: false, error: 'Title and description are required' },
      { status: 400 }
    )
  }

  if (title.trim().length < 3) {
    return NextResponse.json(
      { success: false, error: 'Title must be at least 3 characters' },
      { status: 400 }
    )
  }

  if (description.trim().length < 10) {
    return NextResponse.json(
      { success: false, error: 'Description must be at least 10 characters' },
      { status: 400 }
    )
  }

  // Create app feedback
  const { data, error } = await supabase
    .from('app_feedback')
    .insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
    })
    .select('*, profiles(id, username, full_name, avatar_url)')
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data as AppFeedback })
}
