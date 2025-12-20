import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { BestPractice } from '@/types/database'

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
    .from('best_practices')
    .select('*, profiles(id, username, full_name, avatar_url)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Check if user has permission to view this best practice
  // Drafts can only be viewed by the owner
  if (data.status === 'draft' && data.user_id !== user.id) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
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
  const { title, description, category, status } = body

  // Check if user is owner
  const { data: bestPractice } = await supabase
    .from('best_practices')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!bestPractice || bestPractice.user_id !== user.id) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('best_practices')
    .update({
      title,
      description,
      category,
      status,
    })
    .eq('id', id)
    .is('deleted_at', null)
    .select('*, profiles(id, username, full_name, avatar_url)')
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data as BestPractice })
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
  const { data: bestPractice } = await supabase
    .from('best_practices')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!bestPractice || bestPractice.user_id !== user.id) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  // Soft delete
  const { error } = await supabase
    .from('best_practices')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
