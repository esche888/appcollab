import { NextResponse } from 'next/server'
import { auditService } from '@/lib/audit/audit-service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Log login action
    await auditService.logAuthAction('user_login', userId, {
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging login:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to log login' },
      { status: 500 }
    )
  }
}
