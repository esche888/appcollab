'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ThumbsUp, Lightbulb } from 'lucide-react'

type Suggestion = {
  id: string
  title: string
  description: string
  upvotes: number
  status: string
  created_at: string
  profiles: {
    id: string
    username: string
    full_name: string | null
  }
}

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  implemented: 'bg-blue-100 text-blue-800',
}

interface FeatureSuggestionsProps {
  projectId: string
}

export function FeatureSuggestions({ projectId }: FeatureSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadSuggestions = async () => {
    const response = await fetch(`/api/projects/${projectId}/suggestions`)
    const result = await response.json()

    if (result.success) {
      setSuggestions(result.data)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadSuggestions()
  }, [projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setTitle('')
        setDescription('')
        setShowForm(false)
        loadSuggestions()
      }
    } catch (err) {
      console.error('Error submitting suggestion:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpvote = async (suggestionId: string) => {
    const response = await fetch(`/api/suggestions/${suggestionId}/upvote`, {
      method: 'POST',
    })

    if (response.ok) {
      loadSuggestions()
    }
  }

  if (loading) {
    return <p className="text-gray-600">Loading feature suggestions...</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center">
          <Lightbulb className="h-5 w-5 mr-2" />
          Feature Suggestions
        </h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Suggest Feature'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-blue-50 rounded-lg p-4 space-y-3">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Feature Title
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief title for your feature idea"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your feature suggestion..."
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Suggestion'}
            </Button>
          </div>
        </form>
      )}

      {suggestions.length === 0 ? (
        <p className="text-gray-600">No feature suggestions yet.</p>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{suggestion.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[suggestion.status as keyof typeof statusColors]}`}>
                  {suggestion.status}
                </span>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                <span className="text-sm text-gray-600">
                  by {suggestion.profiles.username}
                </span>
                <button
                  onClick={() => handleUpvote(suggestion.id)}
                  className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600"
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  {suggestion.upvotes}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
