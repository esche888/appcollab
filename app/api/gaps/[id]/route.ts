import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: gapId } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user owns the project this gap belongs to
  const { data: gap } = await supabase
    .from('project_gaps')
    .select('project_id, projects!inner(owner_ids)')
    .eq('id', gapId)
    .single()

  const projects = gap?.projects as unknown as { owner_ids: string[] }
  if (!gap || !projects?.owner_ids?.includes(user.id)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { gap_type, description, is_filled, status } = body

  const updateData: any = {}
  if (gap_type !== undefined) updateData.gap_type = gap_type
  if (description !== undefined) updateData.description = description
  if (is_filled !== undefined) updateData.is_filled = is_filled
  if (status !== undefined) updateData.status = status

  const { data, error } = await supabase
    .from('project_gaps')
    .update(updateData)
    .eq('id', gapId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: gapId } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user owns the project this gap belongs to
  const { data: gap } = await supabase
    .from('project_gaps')
    .select('project_id, projects!inner(owner_ids)')
    .eq('id', gapId)
    .single()

  const projects = gap?.projects as unknown as { owner_ids: string[] }
  if (!gap || !projects?.owner_ids?.includes(user.id)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  // Soft delete
  const { error } = await supabase
    .from('project_gaps')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', gapId)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
