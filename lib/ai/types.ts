export interface AIResponse {
  content: string
  tokensUsed: number
  model: string
  responseTimeMs: number
}

export interface AIProvider {
  name: string
  generateCompletion(prompt: string, context?: Record<string, unknown>): Promise<AIResponse>
  isAvailable(): boolean
}

export type AIModelType = 'chatgpt' | 'gemini' | 'claude'

export type PromptType =
  | 'feedback-enhancement'
  | 'project-description-enhancement'
  | 'feature-suggestion-enhancement'
  | 'skill-matching'
  | 'gap-analysis'
  | 'project-summary'
