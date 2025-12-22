'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown, Edit2, X, Check, MessageSquare } from 'lucide-react'
import { CommentsSection } from '@/components/feature-suggestions/comments-section'

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
  votes?: {
    upvotes: number
    downvotes: number
    userVote: 'up' | 'down' | null
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
  showForm: boolean
  setShowForm: (show: boolean) => void
  isOwner: boolean
  currentUserId: string | null
}

export function FeatureSuggestions({ projectId, showForm, setShowForm, isOwner, currentUserId }: FeatureSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Comments State
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null)

  // ... (rest of the file until handleStatusUpdate)

  const loadVotesForSuggestions = async (suggestionItems: Suggestion[]): Promise<Suggestion[]> => {
    return Promise.all(
      suggestionItems.map(async (item) => {
        // Load votes for this suggestion
        const voteResponse = await fetch(`/api/suggestions/${item.id}/vote`)
        const voteResult = await voteResponse.json()

        return {
          ...item,
          votes: voteResult.success ? voteResult.data : { upvotes: 0, downvotes: 0, userVote: null }
        }
      })
    )
  }

  const loadSuggestions = async () => {
    const response = await fetch(`/api/projects/${projectId}/suggestions`)
    const result = await response.json()

    if (result.success) {
      const suggestionsWithVotes = await loadVotesForSuggestions(result.data)
      setSuggestions(suggestionsWithVotes)
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

  const handleVote = async (suggestionId: string, voteType: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: voteType }),
      })

      const result = await response.json()

      if (result.success) {
        // Update the vote counts in the state
        fetch(`/api/suggestions/${suggestionId}/vote`)
          .then(res => res.json())
          .then(voteResult => {
            if (voteResult.success) {
              setSuggestions(prevSuggestions => {
                return prevSuggestions.map(s => {
                  if (s.id === suggestionId) {
                    return { ...s, votes: voteResult.data }
                  }
                  return s
                })
              })
            }
          })
      } else {
        alert(result.error || 'Failed to vote')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to vote')
    }
  }

  const handleStatusUpdate = async (suggestionId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (result.success) {
        setSuggestions(prev => prev.map(s =>
          s.id === suggestionId ? { ...s, status: newStatus } : s
        ))
      } else {
        alert(result.error || 'Failed to update status')
      }
    } catch (err) {
      // alert(err instanceof Error ? err.message : 'Failed to update status')
      console.error(err)
    }
  }

  const startEditing = (suggestion: Suggestion) => {
    setEditingId(suggestion.id)
    setEditTitle(suggestion.title)
    setEditDescription(suggestion.description)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
  }

  const saveEdit = async (suggestionId: string) => {
    if (!editTitle.trim() || !editDescription.trim()) return

    setSavingEdit(true)
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuggestions(prev => prev.map(s =>
          s.id === suggestionId ? { ...s, title: editTitle, description: editDescription } : s
        ))
        setEditingId(null)
      } else {
        alert(result.error || 'Failed to update suggestion')
      }
    } catch (err) {
      console.error('Failed to update suggestion:', err)
      alert('Failed to update suggestion')
    } finally {
      setSavingEdit(false)
    }
  }

  if (loading) {
    return <p className="text-gray-600">Loading feature suggestions...</p>
  }

  return (
    <div className="space-y-4">
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-4 space-y-3 border border-green-200 shadow-md">
          {/* ...Form fields... */}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
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
        <p className="text-green-800 font-medium">No feature suggestions yet.</p>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="bg-white rounded-lg p-4 border border-green-200 shadow-md">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 mr-4">
                  {editingId === suggestion.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-2 py-1 border border-indigo-200 rounded text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Feature Title"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        className="w-full px-2 py-1 border border-indigo-200 rounded text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Description"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveEdit(suggestion.id)}
                          disabled={savingEdit}
                          className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="h-3 w-3 mr-1" /> Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditing}
                          className="h-7 px-2 hover:bg-gray-100 text-gray-600"
                        >
                          <X className="h-3 w-3 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 group">
                        <h3 className="font-semibold text-gray-900">{suggestion.title}</h3>
                        {currentUserId === suggestion.profiles.id && (
                          <button
                            onClick={() => startEditing(suggestion)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600 p-1"
                            title="Edit Suggestion"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                    </>
                  )}
                </div>

                {isOwner || currentUserId === suggestion.profiles.id ? (
                  <select
                    value={suggestion.status}
                    onChange={(e) => handleStatusUpdate(suggestion.id, e.target.value)}
                    className={`ml-2 px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${statusColors[suggestion.status as keyof typeof statusColors]}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="implemented">Implemented</option>
                  </select>
                ) : (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[suggestion.status as keyof typeof statusColors]}`}>
                    {suggestion.status}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-green-100">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    by {suggestion.profiles.username}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSuggestionId(selectedSuggestionId === suggestion.id ? null : suggestion.id)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Comments
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleVote(suggestion.id, 'up')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${suggestion.votes?.userVote === 'up'
                      ? 'bg-green-100 text-green-700 font-semibold'
                      : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                      }`}
                    title="Thumbs up"
                  >
                    <ThumbsUp className={`h-4 w-4 ${suggestion.votes?.userVote === 'up' ? 'fill-current' : ''}`} />
                    <span className="text-sm">{suggestion.votes?.upvotes || 0}</span>
                  </button>
                  <button
                    onClick={() => handleVote(suggestion.id, 'down')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${suggestion.votes?.userVote === 'down'
                      ? 'bg-red-100 text-red-700 font-semibold'
                      : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                      }`}
                    title="Thumbs down"
                  >
                    <ThumbsDown className={`h-4 w-4 ${suggestion.votes?.userVote === 'down' ? 'fill-current' : ''}`} />
                    <span className="text-sm">{suggestion.votes?.downvotes || 0}</span>
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {selectedSuggestionId === suggestion.id && (
                <div className="mt-4 pt-4 border-t border-green-100">
                  <h4 className="font-semibold text-gray-900 mb-3">Comments</h4>
                  <CommentsSection suggestionId={suggestion.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
