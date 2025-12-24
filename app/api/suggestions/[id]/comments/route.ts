import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { notificationService } from '@/lib/email/notification-service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: suggestionId } = await params

  // Fetch all comments for the suggestion
  const { data, error } = await supabase
    .from('feature_suggestion_comments')
    .select(`
      *,
      profiles (id, username, full_name, avatar_url)
    `)
    .eq('suggestion_id', suggestionId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Organize into threads (top-level comments and their replies)
  const topLevel = data.filter((c: any) => !c.parent_id)
  const threaded = topLevel.map((parent: any) => ({
    ...parent,
    replies: data.filter((c: any) => c.parent_id === parent.id)
  }))

  return NextResponse.json({ success: true, data: threaded })
}

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

  const body = await request.json()
  const { content, parent_id } = body

  if (!content || content.trim() === '') {
    return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 })
  }

  // If parent_id is provided, validate single-level threading
  if (parent_id) {
    const { data: parentComment, error: parentError } = await supabase
      .from('feature_suggestion_comments')
      .select('parent_id')
      .eq('id', parent_id)
      .is('deleted_at', null)
      .single()

    if (parentError || !parentComment) {
      return NextResponse.json({ success: false, error: 'Parent comment not found' }, { status: 404 })
    }

    // Ensure parent has no parent (single-level threading)
    if (parentComment.parent_id !== null) {
      return NextResponse.json({ success: false, error: 'Cannot reply to a reply. Only single-level threading is allowed.' }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('feature_suggestion_comments')
    .insert({
      suggestion_id: suggestionId,
      user_id: user.id,
      content: content.trim(),
      parent_id: parent_id || null,
    })
    .select(`
      *,
      profiles (id, username, full_name, avatar_url)
    `)
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Send notification asynchronously (don't await)
  if (data) {
    // Fetch suggestion and project info for notification
    const { data: suggestionData } = await supabase
      .from('feature_suggestions')
      .select(`
        title,
        project_id,
        projects!inner (title)
      `)
      .eq('id', suggestionId)
      .single()

    if (suggestionData && suggestionData.projects) {
      notificationService
        .notifyFeatureSuggestionCommentCreated({
          projectId: suggestionData.project_id,
          projectTitle: suggestionData.projects.title,
          triggeredByUserId: user.id,
          triggeredByUsername: data.profiles?.username || 'Anonymous',
          triggeredByUserFullName: data.profiles?.full_name,
          contentTitle: suggestionData.title,
          contentPreview: data.content?.substring(0, 200) || '',
          resourceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/projects/${suggestionData.project_id}#suggestions`,
        })
        .catch((err) => console.error('[API] Notification error:', err))
    }
  }

  return NextResponse.json({ success: true, data })
}
