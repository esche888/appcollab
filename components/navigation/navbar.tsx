'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SettingsModal } from './settings-modal'
import { ProfileModal } from './profile-modal'
import { HelpModal } from './help-modal'
import { LogOut, BrainCircuit } from 'lucide-react'
import { useAIUsage } from '@/lib/context/ai-usage-context'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { lastTaskTokens } = useAIUsage()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    { href: '/projects', label: 'Projects' },
    { href: '/best-practices', label: 'Best Practices' },
    { href: '/contributors', label: 'Contributors' },
    { href: '/events', label: 'Recent Events' },
  ]

  return (
    <nav className="glass-effect border-b border-white/20 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex">
            <Link
              href="/projects"
              className="flex items-center px-2 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/appcollab-logo.png"
                alt="AppCollab Logo"
                width={210}
                height={56}
                priority
                className="h-14 w-auto"
              />
            </Link>

            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all ${pathname === item.href
                    ? 'border-appcollab-teal text-gray-900 font-semibold'
                    : 'border-transparent text-gray-600 hover:border-appcollab-blue hover:text-gray-900'
                    }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>


          <div className="flex items-center space-x-4">
            {lastTaskTokens !== null && (
              <div className="hidden md:flex items-center text-sm font-medium text-gray-600 bg-white/50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                <BrainCircuit className="h-4 w-4 mr-2 text-appcollab-teal" />
                <span>
                  Tokens: <span className="text-gray-900 font-bold">{lastTaskTokens.toLocaleString()}</span>
                </span>
              </div>
            )}
            <HelpModal />
            <ProfileModal />
            <SettingsModal />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Logout"
              className="hover:bg-appcollab-teal/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
