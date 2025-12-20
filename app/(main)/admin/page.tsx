import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, FileText, MessageSquare, Sparkles, Settings, ClipboardList } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get stats
  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  const { count: feedbackCount } = await supabase
    .from('feedback')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  const { data: aiLogs } = await supabase
    .from('ai_usage_logs')
    .select('tokens_used')
    .order('request_timestamp', { ascending: false })
    .limit(100)

  const totalTokensUsed = aiLogs?.reduce((sum, log) => sum + log.tokens_used, 0) || 0

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold mt-1">{userCount || 0}</p>
              </div>
              <Users className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-3xl font-bold mt-1">{projectCount || 0}</p>
              </div>
              <FileText className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Feedback</p>
                <p className="text-3xl font-bold mt-1">{feedbackCount || 0}</p>
              </div>
              <MessageSquare className="h-10 w-10 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Tokens Used</p>
                <p className="text-3xl font-bold mt-1">{totalTokensUsed.toLocaleString()}</p>
              </div>
              <Sparkles className="h-10 w-10 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/usage" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-2">
              <Sparkles className="h-6 w-6 mr-3 text-blue-600" />
              <h2 className="text-xl font-semibold">AI Usage Logs</h2>
            </div>
            <p className="text-gray-600">View detailed AI usage statistics and logs</p>
          </Link>

          <Link href="/admin/settings" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-2">
              <Settings className="h-6 w-6 mr-3 text-blue-600" />
              <h2 className="text-xl font-semibold">AI Settings</h2>
            </div>
            <p className="text-gray-600">Configure AI models and settings</p>
          </Link>

          <Link href="/admin/users" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-2">
              <Users className="h-6 w-6 mr-3 text-blue-600" />
              <h2 className="text-xl font-semibold">User Management</h2>
            </div>
            <p className="text-gray-600">View and manage user accounts</p>
          </Link>

          <Link href="/admin/projects" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-2">
              <FileText className="h-6 w-6 mr-3 text-blue-600" />
              <h2 className="text-xl font-semibold">Project History</h2>
            </div>
            <p className="text-gray-600">View all projects and their history</p>
          </Link>

          <Link href="/admin/audit-logs" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-2">
              <ClipboardList className="h-6 w-6 mr-3 text-blue-600" />
              <h2 className="text-xl font-semibold">Audit Logs</h2>
            </div>
            <p className="text-gray-600">View system activity and user actions</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
