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
import { Brain, Copy, Check, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useAIUsage } from '@/lib/context/ai-usage-context'

import type { ProjectWithGaps } from '@/app/(main)/projects/[id]/page'

interface AIAssistantModalProps {
  project: ProjectWithGaps
}

export function AIAssistantModal({
  project
}: AIAssistantModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { setLastTaskTokens } = useAIUsage()
  const [loading, setLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGetGuidance = async () => {
    setLoading(true)
    setError(null)
    setAiResponse(null)

    try {
      const response = await fetch(`/api/projects/${project.id}/ai-guidance`, {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        setAiResponse(result.data.content)
        if (result.data.tokensUsed) {
          setLastTaskTokens(result.data.tokensUsed)
        }
      } else {
        setError(result.error || 'Failed to get AI guidance')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (aiResponse) {
      await navigator.clipboard.writeText(aiResponse)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && !aiResponse && !loading) {
      // Automatically fetch guidance when modal opens
      handleGetGuidance()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="bg-white text-appcollab-orange hover:bg-orange-50"
          size="sm"
          title="AI Assistant"
        >
          <Brain className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            AI Project Assistant
          </DialogTitle>
          <DialogDescription>
            Get AI-powered guidance on how to proceed with this project based on all available information.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
              <p className="text-gray-600">Analyzing project data and generating guidance...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <Button
                onClick={handleGetGuidance}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Try Again
              </Button>
            </div>
          )}

          {aiResponse && !loading && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-purple-900">AI Guidance</h3>
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none text-gray-800">
                  <ReactMarkdown>{aiResponse}</ReactMarkdown>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
                <p>This guidance is AI-generated and should be reviewed carefully.</p>
                <Button
                  onClick={handleGetGuidance}
                  variant="ghost"
                  size="sm"
                >
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
