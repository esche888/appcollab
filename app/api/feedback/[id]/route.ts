import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: feedbackId } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Check if the feedback exists and belongs to the user
  const { data: existingFeedback, error: fetchError } = await supabase
    .from('feedback')
    .select('user_id, parent_id')
    .eq('id', feedbackId)
    .single()

  if (fetchError || !existingFeedback) {
    return NextResponse.json({ success: false, error: 'Feedback not found' }, { status: 404 })
  }

  if (existingFeedback.user_id !== user.id) {
    return NextResponse.json({ success: false, error: 'You can only edit your own feedback' }, { status: 403 })
  }

  const body = await request.json()
  const { content, title } = body

  // Validate: top-level comments must have a title
  if (!existingFeedback.parent_id && !title) {
    return NextResponse.json({ success: false, error: 'Title is required for feedback' }, { status: 400 })
  }

  const updateData: any = {
    content,
  }

  // Only update title for top-level feedback
  if (!existingFeedback.parent_id) {
    updateData.title = title
  }

  const { data, error } = await supabase
    .from('feedback')
    .update(updateData)
    .eq('id', feedbackId)
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
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('=== DELETE FEEDBACK START ===')
  const supabase = await createClient()
  const { id: feedbackId } = await params
  console.log('Step 1: Got feedbackId:', feedbackId)

  const { data: { user } } = await supabase.auth.getUser()
  console.log('Step 2: Got user:', user?.id)

  if (!user) {
    console.log('Step 2a: No user - returning 401')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Check if the feedback exists and belongs to the user
  // Use service role client to bypass RLS for the check too
  console.log('Step 3: Creating service client')
  console.log('Step 3a: Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  console.log('Step 3b: Service role key starts with:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20))
  const serviceClient = createServiceRoleClient()
  console.log('Step 4: Service client created, fetching feedback')

  const { data: existingFeedback, error: fetchError } = await serviceClient
    .from('feedback')
    .select('user_id, id, deleted_at')
    .eq('id', feedbackId)
    .single()

  console.log('Step 5: Existing feedback check:', {
    existingFeedback,
    fetchError,
    feedbackId,
    userId: user.id,
    match: existingFeedback?.user_id === user.id
  })

  if (fetchError || !existingFeedback) {
    return NextResponse.json({ success: false, error: 'Feedback not found' }, { status: 404 })
  }

  if (existingFeedback.user_id !== user.id) {
    return NextResponse.json({ success: false, error: 'You can only delete your own feedback' }, { status: 403 })
  }

  if (existingFeedback.deleted_at) {
    console.log('Step 6: Feedback already deleted')
    return NextResponse.json({ success: false, error: 'Feedback already deleted' }, { status: 400 })
  }

  // Soft delete using RPC function that bypasses RLS
  console.log('Step 7: Calling soft_delete_feedback RPC function')

  const { data: rpcResult, error: rpcError } = await supabase
    .rpc('soft_delete_feedback', {
      feedback_id: feedbackId,
      requesting_user_id: user.id
    })

  console.log('Step 8: RPC Result:', { rpcResult, rpcError })

  if (rpcError) {
    console.error('Step 8a: RPC error:', rpcError)
    return NextResponse.json({ success: false, error: rpcError.message }, { status: 500 })
  }

  if (!rpcResult || !rpcResult.success) {
    console.error('Step 8b: RPC returned failure:', rpcResult)
    return NextResponse.json({ success: false, error: rpcResult?.error || 'Delete failed' }, { status: 500 })
  }

  const { data, count } = { data: [rpcResult.data], count: null }

  console.log('Step 8c: Final result:', {
    hasData: !!data,
    dataLength: data?.length,
    feedbackId
  })

  console.log('Step 9: Full delete result:', { data, count, feedbackId })

  if (!data || data.length === 0) {
    console.log('Step 9a: No rows were updated - FAILURE')
    return NextResponse.json({ success: false, error: 'No rows were updated' }, { status: 500 })
  }

  console.log('Step 10: Delete successful!')
  return NextResponse.json({ success: true, data })
}
