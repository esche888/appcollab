import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { BestPracticeRequest } from '@/types/database'

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
    .from('best_practice_requests')
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

  if (!title || !description) {
    return NextResponse.json(
      { success: false, error: 'Title and description are required' },
      { status: 400 }
    )
  }

  // Check if user is owner
  const { data: bestPracticeRequest } = await supabase
    .from('best_practice_requests')
    .select('user_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!bestPracticeRequest || bestPracticeRequest.user_id !== user.id) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('best_practice_requests')
    .update({
      title,
      description,
    })
    .eq('id', id)
    .is('deleted_at', null)
    .select('*, profiles(id, username, full_name, avatar_url)')
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data as BestPracticeRequest })
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
  const { data: bestPracticeRequest } = await supabase
    .from('best_practice_requests')
    .select('user_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!bestPracticeRequest || bestPracticeRequest.user_id !== user.id) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  // Soft delete
  const { error } = await supabase
    .from('best_practice_requests')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
