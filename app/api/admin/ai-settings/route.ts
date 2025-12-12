import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { aiService } from '@/lib/ai/ai-service'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const availableModels = aiService.getAvailableProviders()
  const activeModel = await aiService.getActiveModel()

  return NextResponse.json({
    success: true,
    data: {
      availableModels,
      activeModel,
    },
  })
}

export async function PUT(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { activeModel } = body

  // Verify model is available
  const availableModels = aiService.getAvailableProviders()
  if (!availableModels.includes(activeModel)) {
    return NextResponse.json(
      { success: false, error: 'Selected model is not available' },
      { status: 400 }
    )
  }

  // Update or insert AI settings
  const { data, error } = await supabase
    .from('ai_settings')
    .upsert({
      active_model: activeModel,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
