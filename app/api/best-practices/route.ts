import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { BestPractice } from '@/types/database'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const userId = searchParams.get('userId')
  const sort = searchParams.get('sort') || 'newest' // 'newest' or 'popular'

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let query = supabase
    .from('best_practices')
    .select('*, profiles(id, username, full_name, avatar_url)')
    .is('deleted_at', null)

  // Filter by category
  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  // Filter by user
  if (userId) {
    query = query.eq('user_id', userId)
  } else {
    // If not filtering by specific user, only show published/archived
    query = query.in('status', ['published', 'archived'])
  }

  // Sort
  if (sort === 'popular') {
    query = query.order('upvotes', { ascending: false }).order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Filter out drafts that don't belong to the current user
  const filteredData = data?.filter((bp: any) => {
    if (bp.status === 'draft') {
      return bp.user_id === user.id
    }
    return true
  })

  return NextResponse.json({ success: true, data: filteredData as BestPractice[] })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, category, status } = body

  // Validate required fields
  if (!title || !description || !category) {
    return NextResponse.json(
      { success: false, error: 'Title, description, and category are required' },
      { status: 400 }
    )
  }

  // Validate status
  const validStatuses = ['draft', 'published', 'archived']
  const bestPracticeStatus = status && validStatuses.includes(status) ? status : 'draft'

  // Create best practice
  const { data, error } = await supabase
    .from('best_practices')
    .insert({
      user_id: user.id,
      title,
      description,
      category,
      status: bestPracticeStatus,
    })
    .select('*, profiles(id, username, full_name, avatar_url)')
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data as BestPractice })
}
