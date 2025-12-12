import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: projectId } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is project owner
  const { data: project } = await supabase
    .from('projects')
    .select('owner_ids')
    .eq('id', projectId)
    .single()

  if (!project || !project.owner_ids.includes(user.id)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { gap_type, description } = body

  const { data, error } = await supabase
    .from('project_gaps')
    .insert({
      project_id: projectId,
      gap_type,
      description,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
