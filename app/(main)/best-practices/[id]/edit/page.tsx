'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BestPracticeForm } from '@/components/best-practices/best-practice-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { BestPractice } from '@/types/database'

export default function EditBestPracticePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [bestPractice, setBestPractice] = useState<BestPractice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [id, setId] = useState<string | null>(null)

  // Unwrap params
  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  // Get current user
  useEffect(() => {
    async function getUserId() {
      const response = await fetch('/api/profile')
      const result = await response.json()
      if (result.success) {
        setUserId(result.data.id)
      }
    }
    getUserId()
  }, [])

  // Load best practice
  useEffect(() => {
    if (!id) return

    async function loadBestPractice() {
      try {
        const response = await fetch(`/api/best-practices/${id}`)
        const result = await response.json()

        if (result.success) {
          setBestPractice(result.data)
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadBestPractice()
  }, [id])

  const handleSubmit = async (data: {
    title: string
    description: string
    category: string
    status: 'draft' | 'published' | 'archived'
  }) => {
    if (!id) return

    const response = await fetch(`/api/best-practices/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (result.success) {
      router.push(`/best-practices/${id}`)
    } else {
      throw new Error(result.error || 'Failed to update best practice')
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !bestPractice) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error || 'Best practice not found'}
          </div>
          <Link href="/best-practices">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Best Practices
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Check if user is owner
  if (userId && bestPractice.user_id !== userId) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            You don't have permission to edit this best practice.
          </div>
          <Link href={`/best-practices/${id}`}>
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Best Practice
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href={`/best-practices/${id}`}>
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Best Practice
          </Button>
        </Link>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Edit Best Practice
          </h1>

          <BestPracticeForm
            mode="edit"
            initialData={bestPractice}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  )
}
