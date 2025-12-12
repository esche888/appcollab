import { createClient as createServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data as Profile
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('Error fetching profile by username:', error)
    return null
  }

  return data as Profile
}

export async function updateProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>
): Promise<Profile | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return null
  }

  return data as Profile
}

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching profiles:', error)
    return []
  }

  return data as Profile[]
}
