import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data })
}
