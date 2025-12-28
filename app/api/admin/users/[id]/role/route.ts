import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { auditService } from '@/lib/audit/audit-service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()
  const { id: targetUserId } = await params

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

  // Prevent users from removing their own admin role
  if (targetUserId === user.id) {
    return NextResponse.json({
      success: false,
      error: 'Cannot modify your own admin role'
    }, { status: 400 })
  }

  const body = await request.json()
  const { role } = body

  // Validate role
  if (!role || !['user', 'admin'].includes(role)) {
    return NextResponse.json({
      success: false,
      error: 'Invalid role. Must be "user" or "admin"'
    }, { status: 400 })
  }

  // Get target user's current role using admin client
  const { data: targetProfile } = await adminSupabase
    .from('profiles')
    .select('role, username, full_name')
    .eq('id', targetUserId)
    .single()

  if (!targetProfile) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
  }

  const oldRole = targetProfile.role

  // Update the role using admin client to bypass RLS
  const { error } = await adminSupabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', targetUserId)

  if (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Log the role change
  auditService
    .logUserAction(
      user.id,
      'user_role_changed',
      targetUserId,
      {
        username: targetProfile.username,
        full_name: targetProfile.full_name,
        old_role: oldRole,
        new_role: role,
        changed_by: user.id
      }
    )
    .catch((err) => console.error('[API] Audit log error:', err))

  return NextResponse.json({
    success: true,
    data: {
      id: targetUserId,
      role,
      old_role: oldRole
    }
  })
}
