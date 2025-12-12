import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Project } from '@/types/database'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const userId = searchParams.get('userId')

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let query = supabase
    .from('projects')
    .select('*')
    .is('deleted_at', null)

  if (status) {
    query = query.eq('status', status)
  }

  if (userId) {
    query = query.contains('owner_ids', [userId])
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data as Project[] })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, short_description, full_description, status, gaps } = body

  // Create project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      title,
      short_description,
      full_description,
      owner_ids: [user.id],
      status: status || 'idea',
    })
    .select()
    .single()

  if (projectError) {
    return NextResponse.json({ success: false, error: projectError.message }, { status: 500 })
  }

  // Create gaps if provided
  if (gaps && gaps.length > 0) {
    const gapsToInsert = gaps.map((gap: { gap_type: string; description?: string }) => ({
      project_id: project.id,
      gap_type: gap.gap_type,
      description: gap.description || null,
    }))

    const { error: gapsError } = await supabase
      .from('project_gaps')
      .insert(gapsToInsert)

    if (gapsError) {
      console.error('Error creating gaps:', gapsError)
    }
  }

  return NextResponse.json({ success: true, data: project as Project })
}
