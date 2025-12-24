'use client'

import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { NotificationPreferences } from '@/types/database'

export function SettingsModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notify_feature_suggestion_added: true,
    notify_feature_suggestion_comment_added: false,
    notify_feedback_added: true,
    notify_feedback_comment_added: false,
  })

  // Load current preferences when modal opens
  useEffect(() => {
    if (open) {
      loadPreferences()
    }
  }, [open])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile')
      const result = await response.json()

      if (result.success && result.data?.notification_preferences) {
        setPreferences(result.data.notification_preferences)
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)

    setSaving(true)
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_preferences: newPreferences,
        }),
      })
    } catch (error) {
      console.error('Error saving preference:', error)
      // Revert on error
      setPreferences(preferences)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Settings">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your application settings and notification preferences.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-600">Loading...</div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium mb-4">Email Notifications</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Receive email notifications for projects you own.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="notify_feature_suggestion_added"
                      checked={preferences.notify_feature_suggestion_added}
                      onCheckedChange={(checked) =>
                        updatePreference('notify_feature_suggestion_added', checked as boolean)
                      }
                      disabled={saving}
                    />
                    <Label
                      htmlFor="notify_feature_suggestion_added"
                      className="text-sm font-normal cursor-pointer"
                    >
                      New feature suggestions on my projects
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="notify_feature_suggestion_comment_added"
                      checked={preferences.notify_feature_suggestion_comment_added}
                      onCheckedChange={(checked) =>
                        updatePreference('notify_feature_suggestion_comment_added', checked as boolean)
                      }
                      disabled={saving}
                    />
                    <Label
                      htmlFor="notify_feature_suggestion_comment_added"
                      className="text-sm font-normal cursor-pointer"
                    >
                      New comments on feature suggestions
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="notify_feedback_added"
                      checked={preferences.notify_feedback_added}
                      onCheckedChange={(checked) =>
                        updatePreference('notify_feedback_added', checked as boolean)
                      }
                      disabled={saving}
                    />
                    <Label
                      htmlFor="notify_feedback_added"
                      className="text-sm font-normal cursor-pointer"
                    >
                      New feedback on my projects
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="notify_feedback_comment_added"
                      checked={preferences.notify_feedback_comment_added}
                      onCheckedChange={(checked) =>
                        updatePreference('notify_feedback_comment_added', checked as boolean)
                      }
                      disabled={saving}
                    />
                    <Label
                      htmlFor="notify_feedback_comment_added"
                      className="text-sm font-normal cursor-pointer"
                    >
                      New replies to feedback threads
                    </Label>
                  </div>
                </div>

                {saving && <p className="text-sm text-gray-500 mt-3">Saving...</p>}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
