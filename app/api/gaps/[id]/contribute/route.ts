import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: gapId } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Check if already contributed
  const { data: existing } = await supabase
    .from('gap_contributors')
    .select('*')
    .eq('gap_id', gapId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (existing) {
    return NextResponse.json({ success: false, error: 'Already tagged to this gap' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('gap_contributors')
    .insert({
      gap_id: gapId,
      user_id: user.id,
      status: 'interested',
    })
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

  // Soft delete
  const { error } = await supabase
    .from('gap_contributors')
    .update({ deleted_at: new Date().toISOString() })
    .eq('gap_id', gapId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
