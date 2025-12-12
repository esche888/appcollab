'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function SettingsModal() {
  const [open, setOpen] = useState(false)

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
            Configure your application settings here.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">General</h3>
              <p className="text-sm text-gray-600">
                General settings will appear here.
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-2">AI Model</h3>
              <p className="text-sm text-gray-600">
                AI model selection will be available for admin users.
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-2">Preferences</h3>
              <p className="text-sm text-gray-600">
                User preferences will appear here.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
