import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; updateId: string }> }
) {
  const supabase = await createClient()
  const { updateId } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the update exists and belongs to the user
  const { data: update } = await supabase
    .from('project_updates')
    .select('user_id, project_id')
    .eq('id', updateId)
    .single()

  if (!update) {
    return NextResponse.json({ success: false, error: 'Update not found' }, { status: 404 })
  }

  // Check if user is the creator or a project owner
  const { data: project } = await supabase
    .from('projects')
    .select('owner_ids')
    .eq('id', update.project_id)
    .single()

  const isCreator = update.user_id === user.id
  const isProjectOwner = project && project.owner_ids.includes(user.id)

  if (!isCreator && !isProjectOwner) {
    return NextResponse.json({ success: false, error: 'Not authorized to delete this update' }, { status: 403 })
  }

  // Soft delete by setting deleted_at
  const { error } = await supabase
    .from('project_updates')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', updateId)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
