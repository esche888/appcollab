'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createAdminUser } from '@/app/actions/admin-actions'
import { Loader2 } from 'lucide-react'

export function CreateAdminDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<boolean>(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const fullName = formData.get('fullName') as string
        const password = formData.get('password') as string

        try {
            const result = await createAdminUser({ email, fullName, password })

            if (result.error) {
                setError(result.error)
            } else {
                setSuccess(true)
                setTimeout(() => {
                    setOpen(false)
                    setSuccess(false)
                }, 1500)
            }
        } catch {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Create Admin User</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Admin User</DialogTitle>
                </DialogHeader>

                {success ? (
                    <div className="bg-green-50 text-green-700 p-4 rounded-md">
                        Admin user created successfully!
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" name="fullName" required placeholder="John Doe" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" name="email" type="email" required placeholder="admin@example.com" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required minLength={8} />
                            <p className="text-xs text-gray-500">Must be at least 8 characters</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Admin Account'
                            )}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
