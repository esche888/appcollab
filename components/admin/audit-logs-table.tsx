'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, Search, Filter } from 'lucide-react'
import type { AuditLog } from '@/types/database'

const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'project_created', label: 'Project Created' },
  { value: 'project_updated', label: 'Project Updated' },
  { value: 'project_deleted', label: 'Project Deleted' },
  { value: 'project_archived', label: 'Project Archived' },
  { value: 'project_unarchived', label: 'Project Unarchived' },
  { value: 'user_created', label: 'User Created' },
  { value: 'user_role_changed', label: 'User Role Changed' },
  { value: 'user_deleted', label: 'User Deleted' },
  { value: 'user_login', label: 'User Login' },
  { value: 'user_logout', label: 'User Logout' },
  { value: 'user_signup', label: 'User Signup' },
  { value: 'ai_settings_changed', label: 'AI Settings Changed' },
  { value: 'admin_settings_changed', label: 'Admin Settings Changed' },
]

interface AuditLogsTableProps {
  logs: (AuditLog & { profiles?: { id: string; username: string; full_name: string | null } })[]
  users: { id: string; username: string; full_name: string | null }[]
  totalCount: number
  currentPage: number
  pageSize: number
}

export function AuditLogsTable({ logs, users, totalCount, currentPage, pageSize }: AuditLogsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState({
    actionType: searchParams.get('actionType') || 'all',
    userId: searchParams.get('userId') || '',
    search: searchParams.get('search') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
  })

  const [showFilters, setShowFilters] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value)
      }
    })

    router.push(`/admin/audit-logs?${params.toString()}`)
  }

  const clearFilters = () => {
    setFilters({
      actionType: 'all',
      userId: '',
      search: '',
      dateFrom: '',
      dateTo: '',
    })
    router.push('/admin/audit-logs')
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams(searchParams.toString())

      const response = await fetch(`/api/admin/audit-logs/export?${params.toString()}`)
      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const getActionBadgeColor = (actionType: string) => {
    if (actionType.includes('created')) return 'bg-green-100 text-green-800'
    if (actionType.includes('deleted')) return 'bg-red-100 text-red-800'
    if (actionType.includes('updated') || actionType.includes('changed')) return 'bg-blue-100 text-blue-800'
    if (actionType.includes('login') || actionType.includes('signup')) return 'bg-purple-100 text-purple-800'
    if (actionType.includes('archived')) return 'bg-orange-100 text-orange-800'
    if (actionType.includes('unarchived')) return 'bg-teal-100 text-teal-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>

          <Button onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <Label htmlFor="actionType">Action Type</Label>
              <select
                id="actionType"
                value={filters.actionType}
                onChange={(e) => handleFilterChange('actionType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              >
                {ACTION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="userId">User</Label>
              <select
                id="userId"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="search">Keyword Search</Label>
              <Input
                id="search"
                type="text"
                placeholder="Search in details..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date/Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(log.created_at).toLocaleDateString()}</div>
                      <div className="text-gray-500">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.profiles ? (
                      <div>
                        <div className="font-medium">
                          {log.profiles.full_name || log.profiles.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{log.profiles.username}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action_type)}`}>
                      {log.action_type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    {log.resource_type && (
                      <div className="text-sm">
                        <div className="capitalize">{log.resource_type}</div>
                        {log.resource_id && (
                          <div className="text-gray-500 font-mono text-xs">
                            {log.resource_id.substring(0, 8)}...
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600 max-w-md">
                      {Object.keys(log.metadata).length > 0 && (
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(log.metadata, null, 2).substring(0, 150)}
                          {JSON.stringify(log.metadata).length > 150 && '...'}
                        </pre>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('page', String(currentPage - 1))
                  router.push(`/admin/audit-logs?${params.toString()}`)
                }}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('page', String(currentPage + 1))
                  router.push(`/admin/audit-logs?${params.toString()}`)
                }}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
