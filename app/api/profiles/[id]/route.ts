import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  // Fetch profile details
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, bio, skills, role, created_at')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (profileError) {
    return NextResponse.json({ success: false, error: profileError.message }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
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
    .eq('user_id', id)
    .is('deleted_at', null)

  return NextResponse.json({
    success: true,
    data: {
      ...profile,
      contributions: contributions || []
    }
  })
}
