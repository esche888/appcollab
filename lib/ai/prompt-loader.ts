import fs from 'fs'
import path from 'path'
import type { PromptType } from './types'

const PROMPTS_DIR = path.join(process.cwd(), 'prompts')

export function loadPrompt(promptType: PromptType): string {
  const filename = `${promptType}.txt`
  const filepath = path.join(PROMPTS_DIR, filename)

  try {
    // Read fresh from filesystem on each call (hot-reloadable)
    const content = fs.readFileSync(filepath, 'utf-8')
    return content.trim()
  } catch (error) {
    console.error(`Error loading prompt ${promptType}:`, error)
    // Return a fallback prompt
    return getFallbackPrompt(promptType)
  }
}

function getFallbackPrompt(promptType: PromptType): string {
  const fallbacks: Record<PromptType, string> = {
    'feedback-enhancement': 'Improve the following feedback to make it more constructive, clear, and helpful:\n\n{content}',
    'project-description-enhancement': 'Improve the following project description to make it more compelling and clear:\n\n{content}',
    'feature-suggestion-enhancement': 'Improve the following feature suggestion to make it more clear and actionable:\n\n{content}',
    'skill-matching': 'Based on the following user skills and project gaps, suggest which projects this user would be a good fit for:\n\nUser skills: {skills}\nProjects: {projects}',
    'gap-analysis': 'Based on the following project description, suggest potential skill gaps or areas where help might be needed:\n\n{description}',
    'project-summary': 'Create a concise 1-2 sentence summary of the following project:\n\n{description}',
    'project-guidance': 'Analyze the following project information and provide guidance on how to proceed:\n\n{context}\n\nProvide specific, actionable recommendations based on the project status, gaps, feature suggestions, feedback, and updates.',
  }

  return fallbacks[promptType] || 'Process the following input:\n\n{content}'
}

export function interpolatePrompt(template: string, variables: Record<string, string>): string {
  let result = template

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`
    result = result.replace(new RegExp(placeholder, 'g'), value)
  }

  return result
}
