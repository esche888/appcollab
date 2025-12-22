'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, ThumbsUp, X } from 'lucide-react'
import type { BestPracticeRequest } from '@/types/database'
import { UserProfileDialog } from '@/components/users/user-profile-dialog'

export function RequestPanel() {
    const [requests, setRequests] = useState<BestPracticeRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newDescription, setNewDescription] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [userVotes, setUserVotes] = useState<Record<string, boolean>>({})

    const loadRequests = async () => {
        try {
            const response = await fetch('/api/best-practices/requests')
            const result = await response.json()
            if (result.success) {
                setRequests(result.data)
                // Load votes for these requests
                result.data.forEach((req: BestPracticeRequest) => checkUserVote(req.id))
            }
        } catch (err) {
            console.error('Failed to load requests:', err)
        } finally {
            setLoading(false)
        }
    }

    const checkUserVote = async (requestId: string) => {
        try {
            const response = await fetch(`/api/best-practices/requests/${requestId}/vote`)
            const result = await response.json()
            if (result.success && result.data.hasVoted) {
                setUserVotes(prev => ({ ...prev, [requestId]: true }))
            }
        } catch (err) {
            console.error('Failed to check vote:', err)
        }
    }

    useEffect(() => {
        loadRequests()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTitle.trim() || !newDescription.trim()) return

        setSubmitting(true)
        try {
            const response = await fetch('/api/best-practices/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    description: newDescription,
                }),
            })

            const result = await response.json()
            if (result.success) {
                setNewTitle('')
                setNewDescription('')
                setShowForm(false)
                loadRequests()
            } else {
                throw new Error(result.error || 'Failed to submit request')
            }
        } catch (err) {
            console.error('Failed to submit request:', err)
            alert(err instanceof Error ? err.message : 'Failed to submit request')
        } finally {
            setSubmitting(false)
        }
    }

    const handleVote = async (requestId: string) => {
        try {
            // Optimistic update
            const isVoted = userVotes[requestId]
            setUserVotes(prev => ({ ...prev, [requestId]: !isVoted }))
            setRequests(prev => prev.map(req => {
                if (req.id === requestId) {
                    return { ...req, upvotes: req.upvotes + (isVoted ? -1 : 1) }
                }
                return req
            }))

            const response = await fetch(`/api/best-practices/requests/${requestId}/vote`, {
                method: 'POST',
            })

            const result = await response.json()
            if (!result.success) {
                // Revert on failure
                setUserVotes(prev => ({ ...prev, [requestId]: isVoted }))
                setRequests(prev => prev.map(req => {
                    if (req.id === requestId) {
                        return { ...req, upvotes: req.upvotes + (isVoted ? 1 : -1) }
                    }
                    return req
                }))
            }
        } catch (err) {
            console.error('Failed to vote:', err)
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-lg border border-appcollab-blue/20 p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-appcollab-blue-dark">Requested Topics</h2>
                    <p className="text-sm text-gray-500">See what others want to learn about</p>
                </div>
                <Button
                    size="sm"
                    variant={showForm ? "outline" : "default"}
                    onClick={() => setShowForm(!showForm)}
                    className={showForm ? "text-gray-600 hover:text-gray-900" : "bg-appcollab-teal hover:bg-appcollab-teal-dark text-white border-none"}
                >
                    {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4 mr-2" />}
                    {showForm ? 'Cancel' : 'Request Topic'}
                </Button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 bg-appcollab-blue/5 p-4 rounded-lg border border-appcollab-blue/10 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-appcollab-blue-dark mb-1">Topic Title</label>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-appcollab-blue bg-white"
                                placeholder="e.g., Supabase RLS Patterns"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-appcollab-blue-dark mb-1">Description</label>
                            <textarea
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-appcollab-blue bg-white"
                                placeholder="What specifically would you like to see covered?"
                                required
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" size="sm" disabled={submitting} className="bg-appcollab-teal-dark hover:bg-appcollab-blue-dark text-white border-none">
                                {submitting ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </div>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading requests...</div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <p className="text-gray-500">No requests yet. Be the first!</p>
                    </div>
                ) : (
                    requests.map((request) => (
                        <div key={request.id} className="group bg-white p-4 rounded-lg border border-gray-100 hover:border-appcollab-teal/30 hover:shadow-md transition-all h-full flex flex-col">
                            <div className="flex gap-4 h-full">
                                <button
                                    onClick={() => handleVote(request.id)}
                                    className={`flex flex-col items-center justify-center min-w-[3rem] h-12 rounded-lg border transition-all ${userVotes[request.id]
                                        ? 'bg-appcollab-teal/10 border-appcollab-teal text-appcollab-teal-dark'
                                        : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-appcollab-teal hover:text-appcollab-teal'
                                        }`}
                                >
                                    <ThumbsUp className={`h-4 w-4 mb-1 ${userVotes[request.id] ? 'fill-current' : ''}`} />
                                    <span className="text-xs font-bold">{request.upvotes}</span>
                                </button>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-appcollab-blue-dark transition-colors">{request.title}</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">{request.description}</p>
                                    <div className="mt-2 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${request.status === 'completed' ? 'bg-appcollab-green/20 text-appcollab-green' :
                                                request.status === 'in_progress' ? 'bg-appcollab-blue/20 text-appcollab-blue-dark' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {request.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        {request.profiles && (
                                            <div className="text-xs text-gray-500 stop-propagation-area" onClick={(e) => e.stopPropagation()}>
                                                <span className="mr-1">Requested by:</span>
                                                <UserProfileDialog userId={request.profiles.id} username={request.profiles.username}>
                                                    <span className="font-medium hover:text-blue-600 hover:underline cursor-pointer">
                                                        {request.profiles.username}
                                                    </span>
                                                </UserProfileDialog>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
