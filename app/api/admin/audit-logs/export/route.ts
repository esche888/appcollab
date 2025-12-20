import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  // Build query based on filters (same as page query)
  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      profiles:user_id (
        username,
        full_name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10000)  // Reasonable limit for exports

  // Apply same filters as the main page
  const actionType = searchParams.get('actionType')
  const userId = searchParams.get('userId')
  const resourceId = searchParams.get('resourceId')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  if (actionType && actionType !== 'all') {
    query = query.eq('action_type', actionType)
  }

  if (userId) {
    query = query.eq('user_id', userId)
  }

  if (resourceId) {
    query = query.eq('resource_id', resourceId)
  }

  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }

  if (dateTo) {
    query = query.lte('created_at', dateTo)
  }

  const { data: logs, error } = await query

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Convert to CSV
  const csv = convertToCSV(logs || [])

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=audit-logs-${new Date().toISOString()}.csv`,
    },
  })
}

function convertToCSV(logs: any[]): string {
  if (logs.length === 0) {
    return 'No data'
  }

  const headers = ['Date/Time', 'User', 'Action', 'Resource Type', 'Resource ID', 'Details']
  const rows = logs.map(log => [
    new Date(log.created_at).toISOString(),
    log.profiles ? (log.profiles.full_name || log.profiles.username) : 'System',
    log.action_type,
    log.resource_type || '',
    log.resource_id || '',
    JSON.stringify(log.metadata),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  return csvContent
}
