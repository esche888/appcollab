import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'

export default async function AIUsagePage() {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

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

  // Fetch AI usage logs using admin client
  const { data: usageLogs } = await adminSupabase
    .from('ai_usage_logs')
    .select(`
      *,
      profiles:user_id (
        username,
        full_name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  // Calculate statistics
  const totalTokens = usageLogs?.reduce((sum, log) => {
    const tokens = log.tokens_used || (log.input_tokens || 0) + (log.output_tokens || 0)
    return sum + tokens
  }, 0) || 0

  const totalRequests = usageLogs?.length || 0

  const modelBreakdown = usageLogs?.reduce((acc, log) => {
    const model = log.model_used || log.model_name || 'unknown'
    acc[model] = (acc[model] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/admin" className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </Link>
          <h1 className="text-3xl font-bold">AI Usage Logs</h1>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-3xl font-bold mt-1">{totalRequests.toLocaleString()}</p>
              </div>
              <Sparkles className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tokens</p>
                <p className="text-3xl font-bold mt-1">{totalTokens.toLocaleString()}</p>
              </div>
              <Sparkles className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Tokens/Request</p>
                <p className="text-3xl font-bold mt-1">
                  {totalRequests > 0 ? Math.round(totalTokens / totalRequests).toLocaleString() : 0}
                </p>
              </div>
              <Sparkles className="h-10 w-10 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Model Breakdown */}
        {Object.keys(modelBreakdown).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Usage by Model</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(modelBreakdown).map(([model, count]) => (
                <div key={model} className="border rounded p-4">
                  <p className="text-sm text-gray-600 capitalize">{model}</p>
                  <p className="text-2xl font-bold mt-1">{count as number} requests</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recent Usage (Last 100 requests)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prompt Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usageLogs && usageLogs.length > 0 ? (
                  usageLogs.map((log) => {
                    const tokens = log.tokens_used || (log.input_tokens || 0) + (log.output_tokens || 0)
                    const timestamp = log.created_at || log.request_timestamp
                    return (
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.profiles?.username || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {log.model_used || log.model_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.prompt_type || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tokens.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.response_time_ms ? `${log.response_time_ms}ms` : 'N/A'}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No AI usage logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
