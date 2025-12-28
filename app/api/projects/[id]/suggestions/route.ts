import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { notificationService } from '@/lib/email/notification-service'
import { auditService } from '@/lib/audit/audit-service'

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
      profiles (id, username, full_name),
      projects!inner (title)
    `)
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Send notification asynchronously (don't await)
  if (data && data.projects && Array.isArray(data.projects) && data.projects[0]) {
    notificationService
      .notifyFeatureSuggestionCreated({
        projectId: projectId,
        projectTitle: data.projects[0].title,
        triggeredByUserId: user.id,
        triggeredByUsername: data.profiles?.username || 'Anonymous',
        triggeredByUserFullName: data.profiles?.full_name,
        contentTitle: data.title,
        contentPreview: data.description?.substring(0, 200) || '',
        resourceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}#suggestions`,
      })
      .catch((err) => console.error('[API] Notification error:', err))

    // Log to audit_logs for Recent Events (asynchronous)
    auditService
      .logFeatureSuggestionAction(
        user.id,
        'feature_suggestion_created',
        data.id,
        {
          project_id: projectId,
          project_title: data.projects[0].title,
          suggestion_title: data.title,
          suggestion_description: data.description?.substring(0, 200) || ''
        }
      )
      .catch((err) => console.error('[API] Audit log error:', err))
  }

  return NextResponse.json({ success: true, data })
}
