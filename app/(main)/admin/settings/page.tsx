'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Check, AlertCircle } from 'lucide-react'

type AIModel = 'chatgpt' | 'gemini' | 'claude'

export default function AdminSettingsPage() {
  const [availableModels, setAvailableModels] = useState<AIModel[]>([])
  const [activeModel, setActiveModel] = useState<AIModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/ai-settings')
      const result = await response.json()

      if (result.success) {
        setAvailableModels(result.data.availableModels)
        setActiveModel(result.data.activeModel)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!activeModel) return

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/ai-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activeModel,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully! No server restart required.' })
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch (error) {
      console.error('Error saving settings:', error) // Added console.error to use the variable
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const modelInfo = {
    chatgpt: {
      name: 'ChatGPT (OpenAI)',
      description: 'GPT-4 Turbo - Fast and reliable, great for general tasks',
      envVar: 'OPENAI_API_KEY',
    },
    gemini: {
      name: 'Gemini (Google)',
      description: 'Gemini Pro - Excellent for analytical tasks',
      envVar: 'GOOGLE_API_KEY',
    },
    claude: {
      name: 'Claude (Anthropic)',
      description: 'Claude 3 Sonnet - Strong reasoning and detailed responses',
      envVar: 'ANTHROPIC_API_KEY',
    },
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">AI Model Settings</h1>
        <p className="text-gray-600 mb-8">
          Configure which AI model to use for enhancement features. Changes take effect immediately.
        </p>

        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded ${message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
              }`}
          >
            {message.text}
          </div>
        )}

        {availableModels.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">No AI Models Available</h3>
                <p className="text-yellow-800 mb-2">
                  No AI API keys are configured. Please add at least one API key to enable AI features.
                </p>
                <p className="text-sm text-yellow-700">
                  Add one or more of the following environment variables to your .env.local file:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-700 mt-2">
                  <li>OPENAI_API_KEY</li>
                  <li>GOOGLE_API_KEY</li>
                  <li>ANTHROPIC_API_KEY</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Select Active AI Model</h2>

          <div className="space-y-4">
            {(Object.keys(modelInfo) as AIModel[]).map((model) => {
              const isAvailable = availableModels.includes(model)
              const info = modelInfo[model]

              return (
                <div
                  key={model}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${activeModel === model
                    ? 'border-blue-500 bg-blue-50'
                    : isAvailable
                      ? 'border-gray-300 hover:border-gray-400'
                      : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    }`}
                  onClick={() => isAvailable && setActiveModel(model)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="font-semibold text-lg">{info.name}</h3>
                        {activeModel === model && (
                          <Check className="h-5 w-5 text-blue-600 ml-2" />
                        )}
                        {!isAvailable && (
                          <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                            Not Configured
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{info.description}</p>
                      {!isAvailable && (
                        <p className="text-xs text-gray-500 mt-2">
                          Missing: {info.envVar}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {availableModels.length > 0 && (
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSave} disabled={saving || !activeModel}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p className="font-medium mb-2">How AI models are used:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Feedback enhancement - Improve clarity and constructiveness</li>
            <li>Project descriptions - Make descriptions more compelling</li>
            <li>Feature suggestions - Clarify and improve suggestions</li>
            <li>Skill matching - Match users to relevant projects</li>
            <li>Gap analysis - Suggest skill gaps for projects</li>
            <li>Project summaries - Generate concise summaries</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
