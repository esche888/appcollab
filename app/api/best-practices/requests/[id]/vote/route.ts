import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const { id: requestId } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has voted
    const { data: userVote } = await supabase
        .from('best_practice_request_votes')
        .select('*')
        .eq('request_id', requestId)
        .eq('user_id', user.id)
        .single()

    return NextResponse.json({
        success: true,
        data: {
            hasVoted: !!userVote
        }
    })
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()
    const { id: requestId } = await params
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
        .from('best_practice_request_votes')
        .select('*')
        .eq('request_id', requestId)
        .eq('user_id', user.id)
        .single()

    try {
        if (existingVote) {
            // Remove vote (toggle off)
            const { error: deleteError } = await supabase
                .from('best_practice_request_votes')
                .delete()
                .eq('id', existingVote.id)

            if (deleteError) throw deleteError

            // Decrement count using admin client
            const { data: request } = await supabaseAdmin
                .from('best_practice_requests')
                .select('upvotes')
                .eq('id', requestId)
                .single()

            if (request) {
                await supabaseAdmin
                    .from('best_practice_requests')
                    .update({ upvotes: Math.max(0, (request.upvotes || 0) - 1) })
                    .eq('id', requestId)
            }

            return NextResponse.json({ success: true, data: { voted: false } })
        } else {
            // Add vote
            const { error: insertError } = await supabase
                .from('best_practice_request_votes')
                .insert({
                    request_id: requestId,
                    user_id: user.id,
                    vote_type: 'up'
                })

            if (insertError) throw insertError

            // Increment count using admin client
            const { data: request } = await supabaseAdmin
                .from('best_practice_requests')
                .select('upvotes')
                .eq('id', requestId)
                .single()

            if (request) {
                await supabaseAdmin
                    .from('best_practice_requests')
                    .update({ upvotes: (request.upvotes || 0) + 1 })
                    .eq('id', requestId)
            }

            return NextResponse.json({ success: true, data: { voted: true } })
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
