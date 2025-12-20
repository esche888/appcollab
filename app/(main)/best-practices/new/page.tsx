'use client'

import { useRouter } from 'next/navigation'
import { BestPracticeForm } from '@/components/best-practices/best-practice-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NewBestPracticePage() {
  const router = useRouter()

  const handleSubmit = async (data: {
    title: string
    description: string
    category: string
    status: 'draft' | 'published' | 'archived'
  }) => {
    const response = await fetch('/api/best-practices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (result.success) {
      router.push(`/best-practices/${result.data.id}`)
    } else {
      throw new Error(result.error || 'Failed to create best practice')
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/best-practices">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Best Practices
          </Button>
        </Link>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Share a Best Practice
          </h1>

          <p className="text-gray-600 mb-8">
            Share your knowledge and experience with the community. Help others learn from your insights and best practices.
          </p>

          <BestPracticeForm
            mode="create"
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  )
}
