'use client'

import { Badge } from '@/components/ui/badge'
import { Calendar, User, Shield } from 'lucide-react'

export type ProfileDetails = {
    id: string
    username: string
    full_name: string | null
    bio: string | null
    skills: string[]
    avatar_url: string | null
    role?: string
    created_at?: string
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

interface UserProfileDetailsProps {
    profile: ProfileDetails
}

export function UserProfileDetails({ profile }: UserProfileDetailsProps) {
    const joinedDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : null

    return (
        <div className="space-y-8">
            {/* Header / Info Card */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-10 w-10 text-gray-400" />
                        )}
                    </div>
                </div>

                {/* Basic Info */}
                <div className="flex-1 space-y-3">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-2xl font-bold text-gray-900">
                                {profile.full_name || profile.username}
                            </h3>
                            {profile.role === 'admin' && (
                                <Badge variant="default" className="bg-appcollab-teal text-white hover:bg-appcollab-teal-dark border-none">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Admin
                                </Badge>
                            )}
                        </div>
                        {profile.full_name && (
                            <p className="text-gray-500 font-medium">@{profile.username}</p>
                        )}
                    </div>

                    {joinedDate && (
                        <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-2" />
                            Joined {joinedDate}
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-6">
                {/* Bio */}
                {profile.bio ? (
                    <div>
                        <h4 className="text-sm font-uppercase tracking-wider text-gray-500 font-bold mb-3">About</h4>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                    </div>
                ) : (
                    <p className="text-gray-400 italic">No biodata provided.</p>
                )}

                {/* Skills */}
                {profile.skills && profile.skills.length > 0 && (
                    <div>
                        <h4 className="text-sm font-uppercase tracking-wider text-gray-500 font-bold mb-3">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill) => (
                                <Badge key={skill} variant="secondary" className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100">
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Contributions */}
            <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-uppercase tracking-wider text-gray-500 font-bold mb-4">Commitments & Contributions</h4>
                {profile.contributions && profile.contributions.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                        {profile.contributions.map((contribution) => (
                            <div key={contribution.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-appcollab-teal/30 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="text-base font-semibold text-gray-900 capitalize flex items-center gap-2">
                                        {contribution.project_gaps.gap_type.replace('_', ' ')}
                                    </div>
                                    <a
                                        href={`/projects/${contribution.project_gaps.project_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-medium text-appcollab-teal hover:underline bg-white px-2 py-1 rounded shadow-sm border border-gray-100"
                                    >
                                        View Project
                                    </a>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                    {contribution.project_gaps.description}
                                </p>
                                <div className="text-xs text-gray-500 flex items-center">
                                    <span className="bg-white px-2 py-1 rounded border border-gray-200">
                                        Project: <span className="font-medium text-gray-800">{contribution.project_gaps.projects.title}</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
                        <p className="text-sm text-gray-500 italic">No active project commitments visible.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
