import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { vote_type } = body

  if (!vote_type || !['up', 'down'].includes(vote_type)) {
    return NextResponse.json({ success: false, error: 'Invalid vote type. Must be "up" or "down"' }, { status: 400 })
  }

  // Check if user already voted on this feedback
  const { data: existingVote } = await supabase
    .from('feedback_votes')
    .select('*')
    .eq('feedback_id', id)
    .eq('user_id', user.id)
    .single()

  if (existingVote) {
    // If the vote is the same, remove it (toggle off)
    if (existingVote.vote_type === vote_type) {
      const { error } = await supabase
        .from('feedback_votes')
        .delete()
        .eq('id', existingVote.id)

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'removed' })
    } else {
      // Update the vote to the new type
      const { data, error } = await supabase
        .from('feedback_votes')
        .update({
          vote_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingVote.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'updated', data })
    }
  } else {
    // Create a new vote
    const { data, error } = await supabase
      .from('feedback_votes')
      .insert({
        feedback_id: id,
        user_id: user.id,
        vote_type,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, action: 'created', data })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Get vote counts
  const { data: votes, error } = await supabase
    .from('feedback_votes')
    .select('vote_type, user_id')
    .eq('feedback_id', id)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  const upvotes = votes?.filter(v => v.vote_type === 'up').length || 0
  const downvotes = votes?.filter(v => v.vote_type === 'down').length || 0
  const userVote = votes?.find(v => v.user_id === user.id)?.vote_type || null

  return NextResponse.json({
    success: true,
    data: {
      upvotes,
      downvotes,
      userVote
    }
  })
}
