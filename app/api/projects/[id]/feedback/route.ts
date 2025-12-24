import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { notificationService } from '@/lib/email/notification-service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: projectId } = await params

  // Fetch all feedback for the project
  const { data, error } = await supabase
    .from('feedback')
    .select(`
      *,
      profiles (id, username, full_name, avatar_url)
    `)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Organize into threads (top-level comments and their replies)
  const topLevel = data.filter((f: any) => !f.parent_id)
  const threaded = topLevel.map((parent: any) => ({
    ...parent,
    replies: data.filter((f: any) => f.parent_id === parent.id)
  }))

  return NextResponse.json({ success: true, data: threaded })
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
  const { content, ai_enhanced, parent_id, title } = body

  // Validate: top-level comments must have a title
  if (!parent_id && !title) {
    return NextResponse.json({ success: false, error: 'Title is required for new feedback threads' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('feedback')
    .insert({
      project_id: projectId,
      user_id: user.id,
      title: parent_id ? null : title, // Only set title for top-level comments
      content,
      ai_enhanced: ai_enhanced || false,
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
    if (!parent_id) {
      // Top-level feedback - notify owners about new feedback
      const { data: projectData } = await supabase
        .from('projects')
        .select('title')
        .eq('id', projectId)
        .single()

      if (projectData) {
        notificationService
          .notifyFeedbackCreated({
            projectId: projectId,
            projectTitle: projectData.title,
            triggeredByUserId: user.id,
            triggeredByUsername: data.profiles?.username || 'Anonymous',
            triggeredByUserFullName: data.profiles?.full_name,
            contentTitle: data.title || 'Feedback',
            contentPreview: data.content?.substring(0, 200) || '',
            resourceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}#feedback`,
          })
          .catch((err) => console.error('[API] Notification error:', err))
      }
    } else {
      // Reply to feedback - notify owners about new comment
      const { data: parentData } = await supabase
        .from('feedback')
        .select(`
          title,
          project_id,
          projects!inner (title)
        `)
        .eq('id', parent_id)
        .single()

      if (parentData && parentData.projects && Array.isArray(parentData.projects) && parentData.projects[0]) {
        notificationService
          .notifyFeedbackCommentCreated({
            projectId: parentData.project_id,
            projectTitle: parentData.projects[0].title,
            triggeredByUserId: user.id,
            triggeredByUsername: data.profiles?.username || 'Anonymous',
            triggeredByUserFullName: data.profiles?.full_name,
            contentTitle: parentData.title || 'Feedback',
            contentPreview: data.content?.substring(0, 200) || '',
            resourceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/projects/${parentData.project_id}#feedback`,
          })
          .catch((err) => console.error('[API] Notification error:', err))
      }
    }
  }

  return NextResponse.json({ success: true, data })
}
