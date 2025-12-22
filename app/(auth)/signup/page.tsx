'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username,
            full_name: fullName,
          },
        },
      })

      if (error) throw error

      // Log the signup action
      if (data.user) {
        try {
          await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: data.user.id,
              email,
              username,
            }),
          })
        } catch (logError) {
          // Don't fail signup if logging fails
          console.error('Failed to log signup:', logError)
        }
      }

      // Redirect to projects after successful signup
      router.push('/projects')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 p-10 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/appcollab-logo.png"
              alt="AppCollab Logo"
              width={200}
              height={53}
              priority
              className="h-auto w-auto max-w-[200px]"
            />
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-appcollab-teal-dark to-appcollab-blue bg-clip-text text-transparent mb-2">
            Join AppCollab
          </h2>
          <p className="text-gray-600">Create your account</p>
          <p className="mt-3 text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-semibold text-appcollab-teal hover:text-appcollab-teal-dark transition-colors">
              sign in to your account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignup} suppressHydrationWarning>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-appcollab-teal focus:border-transparent text-gray-900 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-appcollab-teal focus:border-transparent text-gray-900 transition-all"
                placeholder="johndoe"
              />
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-appcollab-teal focus:border-transparent text-gray-900 transition-all"
                placeholder="John Doe (optional)"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-appcollab-teal focus:border-transparent text-gray-900 transition-all"
                placeholder="••••••••"
              />
              <p className="mt-2 text-xs text-gray-500">
                Must be at least 6 characters
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-gradient-to-r from-appcollab-teal to-appcollab-blue hover:from-appcollab-teal-dark hover:to-appcollab-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-appcollab-teal disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
