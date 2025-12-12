import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { aiService } from '@/lib/ai/ai-service'
import type { PromptType } from '@/lib/ai/types'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, variables } = body

    if (!type || !variables) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type and variables' },
        { status: 400 }
      )
    }

    const response = await aiService.generateCompletion(
      type as PromptType,
      variables,
      user.id
    )

    return NextResponse.json({
      success: true,
      data: {
        content: response.content,
        tokensUsed: response.tokensUsed,
        model: response.model,
      },
      tokens_used: response.tokensUsed,
    })
  } catch (error) {
    console.error('AI enhancement error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred during AI processing',
      },
      { status: 500 }
    )
  }
}
