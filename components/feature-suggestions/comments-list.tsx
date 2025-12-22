'use client'

import { useEffect, useState } from 'react'
import { Reply, Edit, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FeatureSuggestionCommentWithDetails } from '@/types/database'

interface CommentsListProps {
  suggestionId: string
  refreshTrigger: number
}

export function CommentsList({ suggestionId, refreshTrigger }: CommentsListProps) {
  const [comments, setComments] = useState<FeatureSuggestionCommentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [submittingEdit, setSubmittingEdit] = useState(false)

  const loadVotesForComments = async (commentItems: FeatureSuggestionCommentWithDetails[]): Promise<FeatureSuggestionCommentWithDetails[]> => {
    const loadVotesRecursive = async (items: FeatureSuggestionCommentWithDetails[]): Promise<FeatureSuggestionCommentWithDetails[]> => {
      return Promise.all(
        items.map(async (item) => {
          // Load votes for this item
          const voteResponse = await fetch(`/api/suggestions/${suggestionId}/comments/${item.id}/vote`)
          const voteResult = await voteResponse.json()

          const itemWithVotes = {
            ...item,
            votes: voteResult.success ? voteResult.data : { upvotes: 0, downvotes: 0, userVote: null }
          }

          // Load votes for replies recursively
          if (item.replies && item.replies.length > 0) {
            itemWithVotes.replies = await loadVotesRecursive(item.replies)
          }

          return itemWithVotes
        })
      )
    }

    return loadVotesRecursive(commentItems)
  }

  useEffect(() => {
    async function loadComments() {
      const response = await fetch(`/api/suggestions/${suggestionId}/comments`)
      const result = await response.json()

      if (result.success) {
        const commentsWithVotes = await loadVotesForComments(result.data)
        setComments(commentsWithVotes)
      }

      setLoading(false)
    }

    loadComments()
  }, [suggestionId, refreshTrigger])

  useEffect(() => {
    async function getCurrentUser() {
      const response = await fetch('/api/profile')
      const result = await response.json()
      if (result.success) {
        setUserId(result.data.id)
      }
    }
    getCurrentUser()
  }, [])

  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim()) return

    setSubmittingReply(true)
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          parent_id: parentId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Reload comments to show the new reply
        const commentsResponse = await fetch(`/api/suggestions/${suggestionId}/comments`)
        const commentsResult = await commentsResponse.json()
        if (commentsResult.success) {
          const commentsWithVotes = await loadVotesForComments(commentsResult.data)
          setComments(commentsWithVotes)
        }
        setReplyContent('')
        setReplyingTo(null)
      } else {
        alert(result.error || 'Failed to post reply')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to post reply')
    } finally {
      setSubmittingReply(false)
    }
  }

  const handleEditStart = (item: FeatureSuggestionCommentWithDetails) => {
    setEditingId(item.id)
    setEditContent(item.content)
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditContent('')
  }

  const handleEditSubmit = async (commentId: string) => {
    if (!editContent.trim()) return

    setSubmittingEdit(true)
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      })

      const result = await response.json()

      if (result.success) {
        // Reload comments
        const commentsResponse = await fetch(`/api/suggestions/${suggestionId}/comments`)
        const commentsResult = await commentsResponse.json()
        if (commentsResult.success) {
          const commentsWithVotes = await loadVotesForComments(commentsResult.data)
          setComments(commentsWithVotes)
        }
        setEditingId(null)
        setEditContent('')
      } else {
        alert(result.error || 'Failed to update comment')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update comment')
    } finally {
      setSubmittingEdit(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/comments/${commentId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        // Reload comments
        const commentsResponse = await fetch(`/api/suggestions/${suggestionId}/comments`)
        const commentsResult = await commentsResponse.json()
        if (commentsResult.success) {
          const commentsWithVotes = await loadVotesForComments(commentsResult.data)
          setComments(commentsWithVotes)
        }
      } else {
        alert(result.error || 'Failed to delete comment')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete comment')
    }
  }

  const handleVote = async (commentId: string, voteType: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: voteType }),
      })

      const result = await response.json()

      if (result.success) {
        // Update the vote counts in the state
        const updateVotesRecursive = (items: FeatureSuggestionCommentWithDetails[]): FeatureSuggestionCommentWithDetails[] => {
          return items.map(item => {
            if (item.id === commentId) {
              // Reload votes for this specific item
              fetch(`/api/suggestions/${suggestionId}/comments/${commentId}/vote`)
                .then(res => res.json())
                .then(voteResult => {
                  if (voteResult.success) {
                    setComments(prevComments => {
                      const updateItem = (items: FeatureSuggestionCommentWithDetails[]): FeatureSuggestionCommentWithDetails[] => {
                        return items.map(i => {
                          if (i.id === commentId) {
                            return { ...i, votes: voteResult.data }
                          }
                          if (i.replies) {
                            return { ...i, replies: updateItem(i.replies) }
                          }
                          return i
                        })
                      }
                      return updateItem(prevComments)
                    })
                  }
                })
            }
            if (item.replies) {
              return { ...item, replies: updateVotesRecursive(item.replies) }
            }
            return item
          })
        }
        updateVotesRecursive(comments)
      } else {
        alert(result.error || 'Failed to vote')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to vote')
    }
  }

  const renderCommentItem = (item: FeatureSuggestionCommentWithDetails, isReply: boolean = false) => {
    const isAuthor = userId === item.profiles.id
    const isEditing = editingId === item.id

    return (
      <div key={item.id} className={`${isReply ? 'ml-8 mt-3' : ''}`}>
        <div className={`${isReply ? 'bg-white border border-gray-200' : 'bg-gray-50'} rounded-lg p-4`}>
          {isEditing ? (
            // Edit mode
            <div className="space-y-3">
              <div>
                <label htmlFor={`edit-content-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Comment *
                </label>
                <textarea
                  id={`edit-content-${item.id}`}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                  placeholder="Your comment..."
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditCancel}
                  disabled={submittingEdit}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleEditSubmit(item.id)}
                  disabled={submittingEdit || !editContent.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            // View mode
            <>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <span className="font-semibold text-gray-900">
                    {item.profiles.username}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap mb-3">{item.content}</p>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {!isReply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReplyingTo(item.id)
                        setReplyContent('')
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                  )}
                  {isAuthor && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStart(item)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>

                {/* Vote buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleVote(item.id, 'up')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${item.votes?.userVote === 'up'
                        ? 'bg-green-100 text-green-700 font-semibold'
                        : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                      }`}
                    title="Thumbs up"
                  >
                    <ThumbsUp className={`h-4 w-4 ${item.votes?.userVote === 'up' ? 'fill-current' : ''}`} />
                    <span className="text-sm">{item.votes?.upvotes || 0}</span>
                  </button>
                  <button
                    onClick={() => handleVote(item.id, 'down')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${item.votes?.userVote === 'down'
                        ? 'bg-red-100 text-red-700 font-semibold'
                        : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                      }`}
                    title="Thumbs down"
                  >
                    <ThumbsDown className={`h-4 w-4 ${item.votes?.userVote === 'down' ? 'fill-current' : ''}`} />
                    <span className="text-sm">{item.votes?.downvotes || 0}</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {replyingTo === item.id && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReplyingTo(null)
                    setReplyContent('')
                  }}
                  disabled={submittingReply}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleReplySubmit(item.id)}
                  disabled={submittingReply || !replyContent.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {submittingReply ? 'Posting...' : 'Post Reply'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Render replies */}
        {item.replies && item.replies.length > 0 && (
          <div className="space-y-3">
            {item.replies.map((reply) => renderCommentItem(reply, true))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return <p className="text-gray-600">Loading comments...</p>
  }

  if (comments.length === 0) {
    return <p className="text-gray-600">No comments yet. Be the first to comment!</p>
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => renderCommentItem(comment))}
    </div>
  )
}
