import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: projectId } = await params

  const { data, error } = await supabase
    .from('feature_suggestions')
    .select(`
      *,
      profiles (id, username, full_name)
    `)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('upvotes', { ascending: false })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}

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

  const body = await request.json()
  const { title, description } = body

  const { data, error } = await supabase
    .from('feature_suggestions')
    .insert({
      project_id: projectId,
      user_id: user.id,
      title,
      description,
    })
    .select(`
      *,
      profiles (id, username, full_name)
    `)
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
