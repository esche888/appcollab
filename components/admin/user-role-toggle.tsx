'use client'

import { useState } from 'react'
import { Shield, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface UserRoleToggleProps {
  userId: string
  currentRole: 'user' | 'admin'
  username: string
  isCurrentUser: boolean
  onRoleChanged: () => void
}

export function UserRoleToggle({ userId, currentRole, username, isCurrentUser, onRoleChanged }: UserRoleToggleProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const newRole = currentRole === 'admin' ? 'user' : 'admin'

  const handleRoleChange = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      const result = await response.json()

      if (!result.success) {
        const errorMessage = typeof result.error === 'string' ? result.error : 'Failed to update role'
        setError(errorMessage)
        return
      }

      // Success - refresh the page
      onRoleChanged()
      setShowConfirm(false)
    } catch (err) {
      console.error('Error updating user role:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (isCurrentUser) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        currentRole === 'admin'
          ? 'bg-purple-100 text-purple-800'
          : 'bg-green-100 text-green-800'
      }`}>
        {currentRole === 'admin' ? (
          <Shield className="w-3 h-3 mr-1" />
        ) : (
          <User className="w-3 h-3 mr-1" />
        )}
        {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
      </span>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowConfirm(true)}
        className={`${
          currentRole === 'admin'
            ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
            : 'text-green-600 hover:text-green-700 hover:bg-green-50'
        }`}
      >
        {currentRole === 'admin' ? (
          <>
            <Shield className="w-4 h-4 mr-1" />
            Admin
          </>
        ) : (
          <>
            <User className="w-4 h-4 mr-1" />
            User
          </>
        )}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {newRole === 'admin' ? 'Grant Admin Access?' : 'Remove Admin Access?'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {newRole === 'admin' ? (
                  <>
                    <p className="text-sm text-gray-600">
                      You are about to grant administrator privileges to <strong>@{username}</strong>.
                    </p>
                    <p className="text-sm text-gray-600 mt-4">Admins can:</p>
                    <ul className="list-disc ml-6 mt-2 space-y-1 text-sm text-gray-600">
                      <li>Manage user roles</li>
                      <li>View all audit logs</li>
                      <li>Access admin dashboard</li>
                      <li>Modify AI settings</li>
                      <li>View all system data</li>
                    </ul>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">
                    You are about to remove administrator privileges from <strong>@{username}</strong>.
                    <br /><br />
                    They will be converted to a regular user and lose access to all admin features.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleRoleChange().catch((err) => {
                  console.error('Unhandled error in handleRoleChange:', err)
                })
              }}
              disabled={loading}
              className={newRole === 'admin' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-orange-600 hover:bg-orange-700'}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  {newRole === 'admin' ? 'Grant Admin Access' : 'Remove Admin Access'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
