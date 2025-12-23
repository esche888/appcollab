import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navigation/navbar'
import { FloatingFeedbackButton } from '@/components/app-feedback/floating-feedback-button'
import { AIUsageProvider } from '@/lib/context/ai-usage-context'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <AIUsageProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>{children}</main>
        <FloatingFeedbackButton />
      </div>
    </AIUsageProvider>
  )
}
