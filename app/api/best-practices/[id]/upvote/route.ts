import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: bestPracticeId } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Get current upvotes
  const { data: bestPractice } = await supabase
    .from('best_practices')
    .select('upvotes, status')
    .eq('id', bestPracticeId)
    .is('deleted_at', null)
    .single()

  if (!bestPractice) {
    return NextResponse.json({ success: false, error: 'Best practice not found' }, { status: 404 })
  }

  // Only allow upvoting published best practices
  if (bestPractice.status !== 'published') {
    return NextResponse.json({ success: false, error: 'Can only upvote published best practices' }, { status: 400 })
  }

  // Increment upvotes
  const { data, error } = await supabase
    .from('best_practices')
    .update({ upvotes: bestPractice.upvotes + 1 })
    .eq('id', bestPracticeId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
