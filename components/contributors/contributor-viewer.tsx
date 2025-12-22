'use client'

import { useState, useEffect } from 'react'
import { UserProfileDetails, type ProfileDetails } from '@/components/users/user-profile-details'
import { LayoutList, User } from 'lucide-react'

type UserSummary = {
    id: string
    username: string
    full_name: string | null
}

export function ContributorViewer() {
    const [users, setUsers] = useState<UserSummary[]>([])
    const [selectedUserId, setSelectedUserId] = useState<string>('')
    const [profile, setProfile] = useState<ProfileDetails | null>(null)
    const [loadingUsers, setLoadingUsers] = useState(true)
    const [loadingProfile, setLoadingProfile] = useState(false)

    // Fetch all users on mount
    useEffect(() => {
        async function fetchUsers() {
            try {
                const response = await fetch('/api/users')
                const result = await response.json()
                if (result.success) {
                    setUsers(result.data)
                }
            } catch (error) {
                console.error('Error fetching users:', error)
            } finally {
                setLoadingUsers(false)
            }
        }

        fetchUsers()
    }, [])

    // Fetch profile when selection changes
    useEffect(() => {
        if (!selectedUserId) {
            setProfile(null)
            return
        }

        async function fetchProfile() {
            setLoadingProfile(true)
            try {
                const response = await fetch(`/api/profiles/${selectedUserId}`)
                const result = await response.json()
                if (result.success) {
                    setProfile(result.data)
                }
            } catch (error) {
                console.error('Error fetching profile:', error)
            } finally {
                setLoadingProfile(false)
            }
        }

        fetchProfile()
    }, [selectedUserId])

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Styled Header */}
            <div className="bg-gradient-to-r from-orange-500 to-appcollab-orange rounded-2xl shadow-xl p-8 mb-8 text-center">
                <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                    <LayoutList className="h-8 w-8 text-white/90" />
                    Meet the Community
                </h1>
                <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
                    Discover the talented developers, designers, and innovators building the future of AppCollab.
                </p>

                <div className="max-w-lg mx-auto bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                    <div className="flex items-center gap-2 mb-4 text-white justify-center">
                        <User className="h-5 w-5" />
                        <h2 className="text-lg font-semibold">Find a Contributor</h2>
                    </div>

                    {loadingUsers ? (
                        <div className="h-12 w-full bg-white/10 animate-pulse rounded-lg"></div>
                    ) : (
                        <div className="relative">
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-white/70 font-medium transition-all appearance-none [&>option]:text-gray-900 text-center"
                            >
                                <option value="" className="text-gray-500">Select a contributor to view profile...</option>
                                <option disabled>─────────────</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.full_name ? `${user.full_name} (@${user.username})` : `@${user.username}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Profile Display */}
            {selectedUserId && (
                <div className="bg-white rounded-xl shadow-xl overflow-hidden min-h-[400px]">
                    {loadingProfile ? (
                        <div className="p-12 flex flex-col items-center justify-center space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-appcollab-orange"></div>
                            <p className="text-gray-500">Loading profile...</p>
                        </div>
                    ) : profile ? (
                        <div>
                            {/* Content */}
                            <div className="p-8">
                                <UserProfileDetails profile={profile} />
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-500">
                            Failed to load profile.
                        </div>
                    )}
                </div>
            )}

            {!selectedUserId && !loadingUsers && (
                <div className="flex flex-col items-center justify-center p-12 bg-white/50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                    <User className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg">Select a contributor from the dropdown above to view their details.</p>
                </div>
            )}
        </div>
    )
}
