'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Log the login action
      if (data.user) {
        try {
          await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: data.user.id }),
          })
        } catch (logError) {
          // Don't fail login if logging fails
          console.error('Failed to log login:', logError)
        }
      }

      router.push('/projects')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login')
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
            Welcome Back
          </h2>
          <p className="text-gray-600">Sign in to your account</p>
          <p className="mt-3 text-sm text-gray-600">
            Or{' '}
            <Link href="/signup" className="font-semibold text-appcollab-teal hover:text-appcollab-teal-dark transition-colors">
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin} suppressHydrationWarning>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
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
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-appcollab-teal focus:border-transparent text-gray-900 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-gradient-to-r from-appcollab-teal to-appcollab-blue hover:from-appcollab-teal-dark hover:to-appcollab-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-appcollab-teal disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-sm text-center">
            <Link href="/forgot-password" className="font-semibold text-appcollab-teal hover:text-appcollab-teal-dark transition-colors">
              Forgot your password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
