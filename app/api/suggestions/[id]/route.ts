
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, title, description } = body

    // Fetch suggestion to verify permissions
    const { data: suggestion, error: fetchError } = await supabase
        .from('feature_suggestions')
        .select(`
            *,
            projects (
                owner_ids
            )
        `)
        .eq('id', id)
        .single()

    if (fetchError || !suggestion) {
        return NextResponse.json({ success: false, error: 'Suggestion not found' }, { status: 404 })
    }

    const isAuthor = suggestion.user_id === user.id
    // @ts-ignore - Supabase type inference might miss deep join arrays
    const isProjectOwner = suggestion.projects?.owner_ids?.includes(user.id)

    const updates: any = {}

    // Status update: Project Owners or Author
    if (status !== undefined) {
        if (!isProjectOwner && !isAuthor) {
            return NextResponse.json({ success: false, error: 'Only project owners or the author can change status' }, { status: 403 })
        }
        updates.status = status
    }

    // Content update: Author only
    if (title !== undefined || description !== undefined) {
        if (!isAuthor) {
            return NextResponse.json({ success: false, error: 'Only the author can edit the suggestion' }, { status: 403 })
        }
        if (title) updates.title = title
        if (description) updates.description = description
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ success: true, data: suggestion })
    }

    const { data, error } = await supabase
        .from('feature_suggestions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
}
