import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AuditLogsTable } from '@/components/admin/audit-logs-table'

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const params = await searchParams

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

  // Build query based on filters
  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        full_name
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  // Apply filters
  const actionType = params.actionType as string | undefined
  const userId = params.userId as string | undefined
  const resourceId = params.resourceId as string | undefined
  const search = params.search as string | undefined
  const dateFrom = params.dateFrom as string | undefined
  const dateTo = params.dateTo as string | undefined
  const page = parseInt((params.page as string) || '1')
  const pageSize = 50

  if (actionType && actionType !== 'all') {
    query = query.eq('action_type', actionType)
  }

  if (userId) {
    query = query.eq('user_id', userId)
  }

  if (resourceId) {
    query = query.eq('resource_id', resourceId)
  }

  if (search) {
    // Use metadata JSONB search for keyword
    query = query.or(`metadata->>'title'.ilike.%${search}%,metadata->>'email'.ilike.%${search}%`)
  }

  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }

  if (dateTo) {
    query = query.lte('created_at', dateTo)
  }

  // Pagination
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data: logs, count, error } = await query

  if (error) {
    console.error('Error fetching audit logs:', error)
  }

  // Get unique users for filter dropdown
  const { data: users } = await supabase
    .from('profiles')
    .select('id, username, full_name')
    .order('username')

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href="/admin" className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Audit Logs</h1>
              <p className="text-gray-600 mt-1">
                Track all system activities and user actions
              </p>
            </div>
          </div>
        </div>

        <AuditLogsTable
          logs={logs || []}
          users={users || []}
          totalCount={count || 0}
          currentPage={page}
          pageSize={pageSize}
        />
      </div>
    </div>
  )
}
