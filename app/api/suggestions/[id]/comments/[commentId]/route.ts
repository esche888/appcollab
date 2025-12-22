import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const supabase = await createClient()
  const { commentId } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Check if the comment exists and belongs to the user
  const { data: existingComment, error: fetchError } = await supabase
    .from('feature_suggestion_comments')
    .select('user_id')
    .eq('id', commentId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existingComment) {
    return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 })
  }

  if (existingComment.user_id !== user.id) {
    return NextResponse.json({ success: false, error: 'You can only edit your own comments' }, { status: 403 })
  }

  const body = await request.json()
  const { content } = body

  if (!content || content.trim() === '') {
    return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('feature_suggestion_comments')
    .update({ content: content.trim() })
    .eq('id', commentId)
    .select(`
      *,
      profiles (id, username, full_name, avatar_url)
    `)
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const supabase = await createClient()
  const { commentId } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Soft delete using RPC function that bypasses RLS
  const { data: rpcResult, error: rpcError } = await supabase
    .rpc('soft_delete_fs_comment', {
      comment_id: commentId,
      requesting_user_id: user.id
    })

  if (rpcError) {
    return NextResponse.json({ success: false, error: rpcError.message }, { status: 500 })
  }

  if (!rpcResult || !rpcResult.success) {
    return NextResponse.json({ success: false, error: rpcResult?.error || 'Delete failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: rpcResult.data })
}
