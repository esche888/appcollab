import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Check if current user is admin
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!currentProfile || currentProfile.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden - Admin access required' }, { status: 403 })
  }

  // Fetch all users (both active and inactive) using admin client to bypass RLS
  const { data: users, error } = await adminSupabase
    .from('profiles')
    .select('id, username, full_name, role, created_at, deleted_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: users
  })
}
