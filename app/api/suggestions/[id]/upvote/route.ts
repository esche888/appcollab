import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: suggestionId } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Get current upvotes
  const { data: suggestion } = await supabase
    .from('feature_suggestions')
    .select('upvotes')
    .eq('id', suggestionId)
    .single()

  if (!suggestion) {
    return NextResponse.json({ success: false, error: 'Suggestion not found' }, { status: 404 })
  }

  // Increment upvotes
  const { data, error } = await supabase
    .from('feature_suggestions')
    .update({ upvotes: suggestion.upvotes + 1 })
    .eq('id', suggestionId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
