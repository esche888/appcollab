import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIProvider, AIResponse } from '../types'

export class GeminiProvider implements AIProvider {
  name = 'gemini'
  private client: GoogleGenerativeAI | null = null

  constructor() {
    if (process.env.GOOGLE_API_KEY) {
      this.client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
    }
  }

  isAvailable(): boolean {
    return this.client !== null && !!process.env.GOOGLE_API_KEY
  }

  async generateCompletion(prompt: string, context?: Record<string, unknown>): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('Gemini client not initialized. Check your API key.')
    }

    const startTime = Date.now()

    const model = this.client.getGenerativeModel({
      model: context?.model as string || 'gemini-pro',
    })

    const result = await model.generateContent(prompt)
    const response = result.response

    const endTime = Date.now()

    // Gemini doesn't provide token counts in the same way, estimate based on text length
    const estimatedTokens = Math.ceil(response.text().length / 4)

    return {
      content: response.text(),
      tokensUsed: estimatedTokens,
      model: 'gemini-pro',
      responseTimeMs: endTime - startTime,
    }
  }
}
