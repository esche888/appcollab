import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { aiService } from '@/lib/ai/ai-service'

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

  try {
    // Fetch project with all related data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        project_gaps (
          id,
          gap_type,
          description,
          status,
          gap_contributors (
            id,
            profiles (username)
          )
        )
      `)
      .eq('id', id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Fetch feature suggestions
    const { data: suggestions } = await supabase
      .from('feature_suggestions')
      .select('title, description, upvotes, status')
      .eq('project_id', id)
      .is('deleted_at', null)
      .order('upvotes', { ascending: false })
      .limit(10)

    // Fetch feedback
    const { data: feedback } = await supabase
      .from('feedback')
      .select('title, content')
      .eq('project_id', id)
      .is('deleted_at', null)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(10)

    // Fetch project updates
    const { data: updates } = await supabase
      .from('project_updates')
      .select('content, created_at')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Format data for AI
    const projectData = {
      title: project.title,
      description: project.full_description || project.short_description,
      status: project.status,
      website_url: project.website_url,
      github_url: project.github_url,

      gaps: project.project_gaps?.map((gap: {
        gap_type: string
        description: string | null
        status: string
        gap_contributors: Array<{ id: string }>
      }) => ({
        type: gap.gap_type,
        description: gap.description,
        status: gap.status,
        contributors_count: gap.gap_contributors?.length || 0
      })) || [],

      feature_suggestions: suggestions?.map(s => ({
        title: s.title,
        description: s.description,
        upvotes: s.upvotes,
        status: s.status
      })) || [],

      feedback: feedback?.map(f => ({
        title: f.title,
        content: f.content
      })) || [],

      recent_updates: updates?.map(u => ({
        content: u.content,
        date: new Date(u.created_at).toLocaleDateString()
      })) || []
    }

    // Create comprehensive context for AI
    const context = JSON.stringify(projectData, null, 2)

    // Generate AI guidance
    const response = await aiService.generateCompletion(
      'project-guidance',
      { context },
      user.id
    )

    return NextResponse.json({
      success: true,
      data: {
        content: response.content,
        tokensUsed: response.tokensUsed,
        model: response.model,
      },
    })
  } catch (error) {
    console.error('AI guidance error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred generating AI guidance',
      },
      { status: 500 }
    )
  }
}
