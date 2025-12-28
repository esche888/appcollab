'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { GitCommit, ExternalLink, Loader2 } from 'lucide-react'

type Commit = {
  sha: string
  message: string
  author: string
  date: string
  url: string
}

interface CommitHistoryModalProps {
  projectId: string
}

export function CommitHistoryModal({ projectId }: CommitHistoryModalProps) {
  const [open, setOpen] = useState(false)
  const [commits, setCommits] = useState<Commit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCommits = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/commits`)
      const result = await response.json()

      if (result.success) {
        setCommits(result.data)
      } else {
        setError(result.error || 'Failed to load commits')
      }
    } catch (err) {
      console.error('Error loading commits:', err)
      setError('Failed to load commits')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && commits.length === 0) {
      loadCommits()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <GitCommit className="h-4 w-4 mr-2" />
          Commit History
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Commit History</DialogTitle>
          <DialogDescription>
            Recent commits from the project's GitHub repository
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          ) : commits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No commits found
            </div>
          ) : (
            <div className="space-y-4">
              {commits.map((commit) => (
                <div
                  key={commit.sha}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 mb-1 whitespace-pre-line">
                        {commit.message.split('\n')[0]}
                      </p>
                      {commit.message.split('\n').length > 1 && (
                        <p className="text-sm text-gray-600 mb-2 whitespace-pre-line">
                          {(() => {
                            const body = commit.message.split('\n').slice(1).join('\n')
                            // Remove the Claude Code footer if present (split on the robot emoji)
                            const withoutFooter = body.split('🤖')[0]
                            return withoutFooter.trim()
                          })()}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{commit.author}</span>
                        <span>•</span>
                        <span>{new Date(commit.date).toLocaleDateString()}</span>
                        <span>{new Date(commit.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <a
                      href={commit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                      title="View on GitHub"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 font-mono">
                    {commit.sha.substring(0, 7)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
