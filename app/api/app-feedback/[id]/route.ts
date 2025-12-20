import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { AppFeedback } from '@/types/database'

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
    .from('app_feedback')
    .select('*, profiles(id, username, full_name, avatar_url)')
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
  const { title, description } = body

  // Validate fields
  if (!title || !description) {
    return NextResponse.json(
      { success: false, error: 'Title and description are required' },
      { status: 400 }
    )
  }

  // Check if user is owner
  const { data: feedback } = await supabase
    .from('app_feedback')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!feedback || feedback.user_id !== user.id) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('app_feedback')
    .update({
      title: title.trim(),
      description: description.trim(),
    })
    .eq('id', id)
    .is('deleted_at', null)
    .select('*, profiles(id, username, full_name, avatar_url)')
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data as AppFeedback })
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
  const { data: feedback } = await supabase
    .from('app_feedback')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!feedback || feedback.user_id !== user.id) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  // Soft delete
  const { error } = await supabase
    .from('app_feedback')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
