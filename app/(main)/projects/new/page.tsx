'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

const gapTypes = [
  { value: 'idea_assessment', label: 'Idea Assessment' },
  { value: 'ux_design', label: 'UX Design' },
  { value: 'development', label: 'Development' },
  { value: 'deployment', label: 'Deployment' },
  { value: 'commercialization', label: 'Commercialization' },
  { value: 'marketing', label: 'Marketing' },
]

const statuses = [
  { value: 'idea', label: 'Idea Stage' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'seeking_help', label: 'Seeking Help' },
  { value: 'on_hold', label: 'On Hold' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [fullDescription, setFullDescription] = useState('')
  const [status, setStatus] = useState('idea')
  const [selectedGaps, setSelectedGaps] = useState<string[]>([])
  const [gapDescriptions, setGapDescriptions] = useState<Record<string, string>>({})

  const toggleGap = (gapType: string) => {
    setSelectedGaps(prev =>
      prev.includes(gapType)
        ? prev.filter(g => g !== gapType)
        : [...prev, gapType]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const gaps = selectedGaps.map(gapType => ({
        gap_type: gapType,
        description: gapDescriptions[gapType] || '',
      }))

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          short_description: shortDescription,
          full_description: fullDescription,
          status,
          gaps,
        }),
      })

      const result = await response.json()

      if (result.success) {
        router.push(`/projects/${result.data.id}`)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create New Project</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Project Title *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter a catchy project name"
            />
          </div>

          <div>
            <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Short Description *
            </label>
            <input
              id="shortDescription"
              type="text"
              required
              maxLength={200}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="One-line description (max 200 characters)"
            />
            <p className="text-xs text-gray-500 mt-1">
              {shortDescription.length}/200 characters
            </p>
          </div>

          <div>
            <label htmlFor="fullDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Full Description
            </label>
            <textarea
              id="fullDescription"
              rows={6}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your project in detail..."
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Project Status *
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What help do you need? (Select all that apply)
            </label>
            <div className="space-y-4">
              {gapTypes.map((gap) => (
                <div key={gap.value} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={gap.value}
                      checked={selectedGaps.includes(gap.value)}
                      onCheckedChange={() => toggleGap(gap.value)}
                    />
                    <label
                      htmlFor={gap.value}
                      className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      {gap.label}
                    </label>
                  </div>
                  {selectedGaps.includes(gap.value) && (
                    <input
                      type="text"
                      value={gapDescriptions[gap.value] || ''}
                      onChange={(e) =>
                        setGapDescriptions(prev => ({
                          ...prev,
                          [gap.value]: e.target.value,
                        }))
                      }
                      className="ml-6 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder={`Describe what kind of ${gap.label.toLowerCase()} help you need...`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
