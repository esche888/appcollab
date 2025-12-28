import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  // Get admin settings
  const { data: settings } = await adminSupabase
    .from('admin_settings')
    .select('*')
    .single()

  // Return default values if no settings exist
  const defaultSettings = {
    max_commits_to_show: 10,
  }

  return NextResponse.json({
    success: true,
    data: settings || defaultSettings,
  })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { max_commits_to_show } = body

  // Validate
  if (max_commits_to_show && (max_commits_to_show < 1 || max_commits_to_show > 100)) {
    return NextResponse.json(
      { success: false, error: 'Commit count must be between 1 and 100' },
      { status: 400 }
    )
  }

  // Update or insert settings
  const { data, error } = await adminSupabase
    .from('admin_settings')
    .upsert({
      id: 1, // Single row for global settings
      max_commits_to_show,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
