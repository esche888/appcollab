import { ChatGPTProvider } from './providers/chatgpt'
import { GeminiProvider } from './providers/gemini'
import { ClaudeProvider } from './providers/claude'
import { loadPrompt, interpolatePrompt } from './prompt-loader'
import { createClient } from '../supabase/server'
import type { AIProvider, AIModelType, PromptType, AIResponse } from './types'

class AIService {
  private providers: Map<AIModelType, AIProvider>

  constructor() {
    this.providers = new Map([
      ['chatgpt', new ChatGPTProvider()],
      ['gemini', new GeminiProvider()],
      ['claude', new ClaudeProvider()],
    ])
  }

  getAvailableProviders(): AIModelType[] {
    const available: AIModelType[] = []

    for (const [type, provider] of this.providers) {
      if (provider.isAvailable()) {
        available.push(type)
      }
    }

    return available
  }

  async getActiveModel(): Promise<AIModelType> {
    const supabase = await createClient()

    const { data } = await supabase
      .from('ai_settings')
      .select('active_model')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (data && this.providers.get(data.active_model as AIModelType)?.isAvailable()) {
      return data.active_model as AIModelType
    }

    // Fallback to first available provider
    const available = this.getAvailableProviders()
    return available[0] || 'chatgpt'
  }

  async generateCompletion(
    promptType: PromptType,
    variables: Record<string, string>,
    userId?: string
  ): Promise<AIResponse> {
    const activeModel = await this.getActiveModel()
    const provider = this.providers.get(activeModel)

    if (!provider || !provider.isAvailable()) {
      throw new Error(`AI provider ${activeModel} is not available. Please configure an API key.`)
    }

    // Load and interpolate prompt
    const promptTemplate = loadPrompt(promptType)
    const prompt = interpolatePrompt(promptTemplate, variables)

    // Generate completion
    const response = await provider.generateCompletion(prompt)

    // Log usage
    if (userId) {
      await this.logUsage(userId, activeModel, promptType, response.tokensUsed, response.responseTimeMs)
    }

    return response
  }

  private async logUsage(
    userId: string,
    model: string,
    promptType: string,
    tokensUsed: number,
    responseTimeMs: number
  ) {
    const supabase = await createClient()

    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      model_used: model,
      prompt_type: promptType,
      tokens_used: tokensUsed,
      response_time_ms: responseTimeMs,
    })
  }
}

// Singleton instance
export const aiService = new AIService()
