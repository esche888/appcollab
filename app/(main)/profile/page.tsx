'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { COMMON_SKILLS } from '@/types/database'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/lib/hooks/use-debounce'

type Profile = {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  skills: string[]
  avatar_url: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  const supabase = createClient()

  // Debounced values for autosave
  const debouncedUsername = useDebounce(username, 1000)
  const debouncedFullName = useDebounce(fullName, 1000)
  const debouncedBio = useDebounce(bio, 1000)
  const debouncedSkills = useDebounce(selectedSkills, 1000)

  // Load profile data
  useEffect(() => {
    async function loadProfile() {
      const response = await fetch('/api/profile')
      const result = await response.json()

      if (result.success && result.data) {
        const data = result.data
        setProfile(data)
        setUsername(data.username || '')
        setFullName(data.full_name || '')
        setBio(data.bio || '')
        setSelectedSkills(data.skills || [])
      }

      setLoading(false)
    }

    loadProfile()
  }, [])

  // Autosave when debounced values change
  useEffect(() => {
    if (!profile) return

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

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          {saveStatus !== 'idle' && (
            <span className={`text-sm ${
              saveStatus === 'saving' ? 'text-gray-500' :
              saveStatus === 'saved' ? 'text-green-600' :
              'text-red-600'
            }`}>
              {saveStatus === 'saving' ? 'Saving...' :
               saveStatus === 'saved' ? 'Saved' :
               'Error saving'}
            </span>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              Your profile is automatically saved as you type
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
