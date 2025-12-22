
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
    const { status } = body

    // We should verify that the user is the owner of the project this suggestion belongs to.
    // However, relying on RLS is safer and simpler if the policy "Project owners can update suggestion status" is correctly set up.
    // Based on the schema I read earlier, RLS check:
    // CREATE POLICY "Project owners can update suggestion status" ON feature_suggestions FOR UPDATE
    // USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = feature_suggestions.project_id AND auth.uid() = ANY(projects.owner_ids)));

    const { data, error } = await supabase
        .from('feature_suggestions')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
}
