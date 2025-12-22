'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'


import { UserProfileDetails, type ProfileDetails } from './user-profile-details'

type Profile = ProfileDetails

interface UserProfileDialogProps {
    userId: string
    username?: string // Optional initial display name
    children: React.ReactNode
}

export function UserProfileDialog({ userId, username, children }: UserProfileDialogProps) {
    const [open, setOpen] = useState(false)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (open) {
            setLoading(true)
            async function loadProfile() {
                try {
                    const response = await fetch(`/api/profiles/${userId}`)
                    const result = await response.json()

                    if (result.success && result.data) {
                        setProfile(result.data)
                    }
                } catch (error) {
                    console.error('Error loading profile:', error)
                } finally {
                    setLoading(false)
                }
            }

            loadProfile()
        }
    }, [open, userId])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <span className="cursor-pointer hover:opacity-80 inline-flex items-center">
                    {children}
                </span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {profile ? (
                            <div className="flex flex-col gap-1">
                                <span className="text-xl">{profile.full_name || profile.username}</span>
                                {profile.full_name && <span className="text-sm font-normal text-gray-500">@{profile.username}</span>}
                            </div>
                        ) : (
                            <span>{username || 'User Profile'}</span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="py-8 flex justify-center">
                        <div className="animate-pulse flex flex-col items-center gap-4 w-full">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                ) : profile ? (
                    <UserProfileDetails profile={profile} />
                ) : (
                    <div className="py-8 text-center text-gray-500">
                        Failed to load profile.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
