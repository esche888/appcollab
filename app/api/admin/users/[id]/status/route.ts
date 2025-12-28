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

  // Prevent users from deactivating their own account
  if (targetUserId === user.id) {
    return NextResponse.json({
      success: false,
      error: 'Cannot modify your own account status'
    }, { status: 400 })
  }

  const body = await request.json()
  const { active } = body

  // Validate active status
  if (typeof active !== 'boolean') {
    return NextResponse.json({
      success: false,
      error: 'Invalid status. Must be a boolean value'
    }, { status: 400 })
  }

  // Get target user's current status using admin client
  const { data: targetProfile } = await adminSupabase
    .from('profiles')
    .select('deleted_at, username, full_name')
    .eq('id', targetUserId)
    .single()

  if (!targetProfile) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
  }

  const wasActive = targetProfile.deleted_at === null

  // Update the status using admin client to bypass RLS
  const { error } = await adminSupabase
    .from('profiles')
    .update({
      deleted_at: active ? null : new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', targetUserId)

  if (error) {
    console.error('Error updating user status:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Log the status change
  auditService
    .logUserAction(
      user.id,
      'user_status_changed',
      targetUserId,
      {
        username: targetProfile.username,
        full_name: targetProfile.full_name,
        old_status: wasActive ? 'active' : 'inactive',
        new_status: active ? 'active' : 'inactive',
        changed_by: user.id
      }
    )
    .catch((err) => console.error('[API] Audit log error:', err))

  return NextResponse.json({
    success: true,
    data: {
      id: targetUserId,
      active,
      previous_status: wasActive ? 'active' : 'inactive'
    }
  })
}
