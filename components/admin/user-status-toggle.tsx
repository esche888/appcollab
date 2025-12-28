'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
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

interface UserStatusToggleProps {
  userId: string
  isActive: boolean
  username: string
  isCurrentUser: boolean
  onStatusChanged: () => void
}

export function UserStatusToggle({ userId, isActive, username, isCurrentUser, onStatusChanged }: UserStatusToggleProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const newStatus = !isActive

  const handleStatusChange = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newStatus })
      })

      const result = await response.json()

      if (!result.success) {
        const errorMessage = typeof result.error === 'string' ? result.error : 'Failed to update status'
        setError(errorMessage)
        return
      }

      // Success - refresh the page
      onStatusChanged()
      setShowConfirm(false)
    } catch (err) {
      console.error('Error updating user status:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (isCurrentUser) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-800'
      }`}>
        {isActive ? (
          <>
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3 mr-1" />
            Inactive
          </>
        )}
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
          isActive
            ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
            : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
        }`}
      >
        {isActive ? (
          <>
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Active
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4 mr-1" />
            Inactive
          </>
        )}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {newStatus ? 'Activate User Account?' : 'Deactivate User Account?'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {newStatus ? (
                  <>
                    <p className="text-sm text-gray-600">
                      You are about to activate the account for <strong>@{username}</strong>.
                    </p>
                    <p className="text-sm text-gray-600 mt-4">This will:</p>
                    <ul className="list-disc ml-6 mt-2 space-y-1 text-sm text-gray-600">
                      <li>Restore their access to the platform</li>
                      <li>Allow them to log in again</li>
                      <li>Make their profile and contributions visible</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">
                      You are about to deactivate the account for <strong>@{username}</strong>.
                    </p>
                    <p className="text-sm text-gray-600 mt-4">This will:</p>
                    <ul className="list-disc ml-6 mt-2 space-y-1 text-sm text-gray-600">
                      <li>Prevent them from logging in</li>
                      <li>Hide their profile from other users</li>
                      <li>Preserve their data for potential reactivation</li>
                    </ul>
                    <p className="text-sm text-gray-600 mt-4">
                      <strong>Note:</strong> This is a soft delete. Their account can be reactivated later.
                    </p>
                  </>
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
                handleStatusChange().catch((err) => {
                  console.error('Unhandled error in handleStatusChange:', err)
                })
              }}
              disabled={loading}
              className={newStatus ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  {newStatus ? 'Activate Account' : 'Deactivate Account'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
