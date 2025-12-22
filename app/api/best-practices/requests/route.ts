import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { BestPracticeRequest } from '@/types/database'

export async function GET(request: Request) {
    const supabase = await createClient()

    // Ensure user is authenticated to read requests
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch requests
    const { data, error } = await supabase
        .from('best_practice_requests')
        .select('*, profiles(id, username, full_name, avatar_url)')
        .is('deleted_at', null)
        .order('upvotes', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data as BestPracticeRequest[] })
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description } = body

    if (!title || !description) {
        return NextResponse.json(
            { success: false, error: 'Title and description are required' },
            { status: 400 }
        )
    }

    const { data, error } = await supabase
        .from('best_practice_requests')
        .insert({
            user_id: user.id,
            title,
            description,
            status: 'open',
        })
        .select('*')
        .single()

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data as BestPracticeRequest })
}
