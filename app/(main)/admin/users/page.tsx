'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CreateAdminDialog } from '@/components/admin/create-admin-dialog'
import { UserRoleToggle } from '@/components/admin/user-role-toggle'
import { UserStatusToggle } from '@/components/admin/user-status-toggle'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

type UserProfile = {
    id: string
    username: string
    full_name: string | null
    role: 'user' | 'admin'
    created_at: string
    deleted_at: string | null
}

export default function AdminUsersPage() {
    const router = useRouter()
    const [users, setUsers] = useState<UserProfile[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    const loadUsers = async () => {
        try {
            // Get current user
            const profileRes = await fetch('/api/profile')
            const profileData = await profileRes.json()

            if (!profileData.success) {
                router.push('/login')
                return
            }

            setCurrentUserId(profileData.data.id)

            // Check if admin
            if (profileData.data.role !== 'admin') {
                router.push('/dashboard')
                return
            }

            // Fetch all users
            const response = await fetch('/api/admin/users')
            const result = await response.json()

            if (result.success) {
                setUsers(result.data)
            }
        } catch (error) {
            console.error('Error loading users:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUsers()
    }, [])

    const handleRoleChanged = () => {
        loadUsers()
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <p className="text-gray-600">Loading users...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                        <Link href="/admin" className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors">
                            <ArrowLeft className="h-6 w-6 text-gray-600" />
                        </Link>
                        <h1 className="text-3xl font-bold">User Management</h1>
                    </div>

                    <CreateAdminDialog />
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Join Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users?.map((userProfile) => (
                                <TableRow key={userProfile.id} className={userProfile.deleted_at ? 'opacity-60' : ''}>
                                    <TableCell>
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 text-xl font-bold bg-primary/10 text-primary rounded-full flex items-center justify-center mr-3">
                                                {userProfile.full_name?.[0]?.toUpperCase() || userProfile.username?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <div className="font-medium">{userProfile.full_name || 'No Name'}</div>
                                                <div className="text-sm text-gray-500">@{userProfile.username}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <UserRoleToggle
                                            userId={userProfile.id}
                                            currentRole={userProfile.role}
                                            username={userProfile.username}
                                            isCurrentUser={userProfile.id === currentUserId}
                                            onRoleChanged={handleRoleChanged}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <UserStatusToggle
                                            userId={userProfile.id}
                                            isActive={userProfile.deleted_at === null}
                                            username={userProfile.username}
                                            isCurrentUser={userProfile.id === currentUserId}
                                            onStatusChanged={handleRoleChanged}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {new Date(userProfile.created_at).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
