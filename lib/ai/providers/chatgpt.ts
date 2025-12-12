import OpenAI from 'openai'
import type { AIProvider, AIResponse } from '../types'

export class ChatGPTProvider implements AIProvider {
  name = 'chatgpt'
  private client: OpenAI | null = null

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    }
  }

  isAvailable(): boolean {
    return this.client !== null && !!process.env.OPENAI_API_KEY
  }

  async generateCompletion(prompt: string, context?: Record<string, unknown>): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Check your API key.')
    }

    const startTime = Date.now()

    const response = await this.client.chat.completions.create({
      model: context?.model as string || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: (context?.temperature as number) || 0.7,
    })

    const endTime = Date.now()

    return {
      content: response.choices[0]?.message?.content || '',
      tokensUsed: response.usage?.total_tokens || 0,
      model: response.model,
      responseTimeMs: endTime - startTime,
    }
  }
}
