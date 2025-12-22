import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Profile } from '@/types/database'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (profileError) {
    return NextResponse.json({ success: false, error: profileError.message }, { status: 500 })
  }

  // Fetch contributions (gaps the user is filling)
  const { data: contributions, error: contributionsError } = await supabase
    .from('gap_contributors')
    .select(`
      id,
      gap_id,
      status,
      project_gaps!inner(
        id,
        gap_type,
        description,
        project_id,
        projects!inner(
          id,
          title
        )
      )
    `)
    .eq('user_id', user.id)
    .is('deleted_at', null)

  if (contributionsError) {
    console.error('Error fetching contributions:', contributionsError)
    // Don't fail the whole request, just return empty contributions
  }

  return NextResponse.json({
    success: true,
    data: {
      ...profile,
      contributions: contributions || []
    }
  })
}

export async function PUT(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { username, full_name, bio, skills, avatar_url } = body

  const { data, error } = await supabase
    .from('profiles')
    .update({
      username,
      full_name,
      bio,
      skills,
      avatar_url,
      project_filters: body.project_filters,
      best_practice_filters: body.best_practice_filters,
    })
    .eq('id', user.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data as Profile })
}
