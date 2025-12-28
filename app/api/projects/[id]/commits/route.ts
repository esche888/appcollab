import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()
  const { id: projectId } = await params

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Get project
  const { data: project } = await adminSupabase
    .from('projects')
    .select('github_url')
    .eq('id', projectId)
    .single()

  if (!project || !project.github_url) {
    return NextResponse.json({ success: false, error: 'Project not found or has no GitHub URL' }, { status: 404 })
  }

  // Parse GitHub URL to get owner and repo
  const githubUrl = project.github_url
  const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)

  if (!match) {
    return NextResponse.json({ success: false, error: 'Invalid GitHub URL' }, { status: 400 })
  }

  const [, owner, repoWithExt] = match
  const repo = repoWithExt.replace(/\.git$/, '')

  // Get max commits setting
  const { data: settings } = await adminSupabase
    .from('admin_settings')
    .select('max_commits_to_show')
    .single()

  const maxCommits = settings?.max_commits_to_show || 10

  // Fetch commits from GitHub API
  try {
    const githubResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${maxCommits}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AppCollab',
          ...(process.env.GITHUB_TOKEN ? { 'Authorization': `token ${process.env.GITHUB_TOKEN}` } : {})
        }
      }
    )

    if (!githubResponse.ok) {
      const errorData = await githubResponse.json().catch(() => ({}))
      return NextResponse.json({
        success: false,
        error: errorData.message || 'Failed to fetch commits from GitHub'
      }, { status: githubResponse.status })
    }

    const commits = await githubResponse.json()

    // Format commits
    const formattedCommits = commits.map((commit: any) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      url: commit.html_url
    }))

    return NextResponse.json({
      success: true,
      data: formattedCommits
    })
  } catch (error) {
    console.error('Error fetching GitHub commits:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch commits from GitHub'
    }, { status: 500 })
  }
}
