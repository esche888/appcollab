import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Shield, User } from 'lucide-react'
import { CreateAdminDialog } from '@/components/admin/create-admin-dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default async function AdminUsersPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin') {
        redirect('/dashboard')
    }

    // Fetch all users
    const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

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
                                <TableHead>Join Date</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users?.map((userProfile) => (
                                <TableRow key={userProfile.id}>
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
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userProfile.role === 'admin'
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-green-100 text-green-800'
                                            }`}>
                                            {userProfile.role === 'admin' ? (
                                                <Shield className="w-3 h-3 mr-1" />
                                            ) : (
                                                <User className="w-3 h-3 mr-1" />
                                            )}
                                            {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(userProfile.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-gray-500">Active</span>
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
