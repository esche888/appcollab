'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type AdminCreationData = {
    email: string
    fullName: string
    password: string
}

export async function createAdminUser(data: AdminCreationData) {
    const supabase = await createClient()

    // 1. Verify current user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin') {
        return { error: 'Unauthorized: Admin access required' }
    }

    // 2. Create user using service role key
    const adminSupabase = createAdminClient()

    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
            full_name: data.fullName
        }
    })

    if (createError) {
        console.error('Error creating admin user:', createError)
        return { error: createError.message }
    }

    if (!newUser.user) {
        return { error: 'Failed to create user' }
    }

    // 3. Update profile role to admin
    // The profile should have been created by the trigger, but we need to update the role.
    // We might need to wait a moment or just update it directly using admin client.

    // Update role using admin client to bypass RLS if necessary (though profiles table seems to have RLS that might restrict updates)
    const { error: updateError } = await adminSupabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', newUser.user.id)

    if (updateError) {
        console.error('Error updating profile role:', updateError)
        // Cleanup if possible? Or just return error
        return { error: 'User created but failed to set admin role: ' + updateError.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
}
