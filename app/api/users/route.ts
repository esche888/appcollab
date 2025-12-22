import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .is('deleted_at', null)
        .order('username')

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
}
