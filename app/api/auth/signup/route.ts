import { NextResponse } from 'next/server'
import { auditService } from '@/lib/audit/audit-service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, email, username } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Log signup action
    await auditService.logAuthAction('user_signup', userId, {
      email,
      username,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging signup:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to log signup' },
      { status: 500 }
    )
  }
}
