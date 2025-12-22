
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const next = searchParams.get('next') ?? '/projects'

    // Standard Authorization Code Grant (PKCE)
    const code = searchParams.get('code')

    if (code) {
        const supabase = createClient()
        const { error } = await (await supabase).auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${getOrigin(request)}${next}`)
        }
    }

    // Token Hash Verification (for Magic Links / Recovery)
    if (token_hash && type) {
        const supabase = createClient()

        const { error } = await (await supabase).auth.verifyOtp({
            type,
            token_hash,
        })
        if (!error) {
            return NextResponse.redirect(`${getOrigin(request)}${next}`)
        }
    }

    // If error, redirect to error page
    return NextResponse.redirect(`${getOrigin(request)}/error`)
}

function getOrigin(request: NextRequest) {
    const origin = request.nextUrl.origin
    // In some environments, origin might be localhost if behind a proxy without proper headers
    // Ideally we prefer the request origin, or env var override
    return origin
}
