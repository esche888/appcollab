'use client'

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { FeedbackModal } from './feedback-modal'

export function FloatingFeedbackButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 group"
        aria-label="Send Feedback"
      >
        <MessageSquare className="h-6 w-6" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm font-medium px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          Send AppCollab Feedback
        </span>
      </button>

      <FeedbackModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  )
}
