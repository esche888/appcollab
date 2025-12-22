'use client'

import { useState, useEffect } from 'react'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { COMMON_SKILLS } from '@/types/database'
import { Checkbox } from '@/components/ui/checkbox'
import { useDebounce } from '@/lib/hooks/use-debounce'

type Profile = {
  id: string
  username: string
  email?: string
  full_name: string | null
  bio: string | null
  skills: string[]
  avatar_url: string | null
  contributions?: {
    id: string
    gap_id: string
    status: string
    project_gaps: {
      id: string
      project_id: string
      gap_type: string
      description: string
      projects: {
        id: string
        title: string
      }
    }
  }[]
}

export function ProfileModal() {
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  const supabase = createClient()

  // Debounced values for autosave
  const debouncedUsername = useDebounce(username, 1000)
  const debouncedFullName = useDebounce(fullName, 1000)
  const debouncedBio = useDebounce(bio, 1000)
  const debouncedSkills = useDebounce(selectedSkills, 1000)

  // Load profile data when modal opens
  useEffect(() => {
    if (open) {
      async function loadProfile() {
        const response = await fetch('/api/profile')
        const result = await response.json()

        if (result.success && result.data) {
          const data = result.data
          setProfile(data)
          setUsername(data.username || '')
          setEmail(data.email || '')
          setFullName(data.full_name || '')
          setBio(data.bio || '')
          setSelectedSkills(data.skills || [])
        }

        setLoading(false)
      }

      loadProfile()
    }
  }, [open])

  // Autosave when debounced values change
  useEffect(() => {
    if (!profile || !open) return

    const hasChanges =
      debouncedUsername !== profile.username ||
      debouncedFullName !== (profile.full_name || '') ||
      debouncedBio !== (profile.bio || '') ||
      JSON.stringify(debouncedSkills) !== JSON.stringify(profile.skills)

    if (hasChanges) {
      saveProfile()
    }
  }, [debouncedUsername, debouncedFullName, debouncedBio, debouncedSkills])

  const saveProfile = async () => {
    setSaveStatus('saving')

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: debouncedUsername,
          full_name: debouncedFullName,
          bio: debouncedBio,
          skills: debouncedSkills,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setProfile(result.data)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setSaveStatus('error')
    }
  }

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Profile">
          <User className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Your Profile</DialogTitle>
          <DialogDescription>
            Manage your profile information and skills.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8">
            <p className="text-center text-gray-600">Loading profile...</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {saveStatus !== 'idle' && (
              <div className={`text-sm text-center ${saveStatus === 'saving' ? 'text-gray-500' :
                saveStatus === 'saved' ? 'text-green-600' :
                  'text-red-600'
                }`}>
                {saveStatus === 'saving' ? 'Saving...' :
                  saveStatus === 'saved' ? 'Saved' :
                    'Error saving'}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="slug"
                readOnly
                disabled
                value={email}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Skills
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Select the skills you can contribute to projects
              </p>
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-2 border rounded-md">
                {COMMON_SKILLS.map((skill) => (
                  <div key={skill} className="flex items-center space-x-2">
                    <Checkbox
                      id={skill}
                      checked={selectedSkills.includes(skill)}
                      onCheckedChange={() => toggleSkill(skill)}
                    />
                    <label
                      htmlFor={skill}
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {skill}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* My Commitments Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                My Commitments
              </label>
              {profile && profile.contributions && profile.contributions.length > 0 ? (
                <div className="space-y-3 max-h-[200px] overflow-y-auto p-2 border rounded-md bg-gray-50">
                  {profile.contributions.map((contribution) => (
                    <div key={contribution.id} className="p-3 bg-white rounded shadow-sm border border-gray-100">
                      <div className="text-sm font-medium text-gray-900">
                        {contribution.project_gaps.gap_type.replace('_', ' ')}
                      </div>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                        {contribution.project_gaps.description}
                      </p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-appcollab-teal-dark font-medium">
                          at {contribution.project_gaps.projects.title}
                        </span>
                        <a
                          href={`/projects/${contribution.project_gaps.project_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Project
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic p-2 border rounded-md bg-gray-50 text-center">
                  You haven't signed up for any project gaps yet.
                </p>
              )}
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                Your profile is automatically saved as you type
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
