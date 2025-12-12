import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, AIResponse } from '../types'

export class ClaudeProvider implements AIProvider {
  name = 'claude'
  private client: Anthropic | null = null

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })
    }
  }

  isAvailable(): boolean {
    return this.client !== null && !!process.env.ANTHROPIC_API_KEY
  }

  async generateCompletion(prompt: string, context?: Record<string, unknown>): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('Claude client not initialized. Check your API key.')
    }

    const startTime = Date.now()

    const response = await this.client.messages.create({
      model: context?.model as string || 'claude-3-sonnet-20240229',
      max_tokens: (context?.max_tokens as number) || 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const endTime = Date.now()

    // Extract text content from response
    const content = response.content[0]?.type === 'text' ? response.content[0].text : ''

    return {
      content,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      model: response.model,
      responseTimeMs: endTime - startTime,
    }
  }
}
