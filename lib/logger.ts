import pino from 'pino'

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
})

// Helper functions for structured logging
export function logRequest(method: string, url: string, userId?: string) {
  logger.info({
    type: 'request',
    method,
    url,
    userId,
  }, `${method} ${url}`)
}

export function logResponse(method: string, url: string, status: number, duration: number) {
  logger.info({
    type: 'response',
    method,
    url,
    status,
    duration,
  }, `${method} ${url} - ${status} (${duration}ms)`)
}

export function logError(error: Error, context?: Record<string, unknown>) {
  logger.error({
    type: 'error',
    error: {
      message: error.message,
      stack: error.stack,
    },
    ...context,
  }, error.message)
}

export function logAIUsage(
  userId: string,
  model: string,
  promptType: string,
  tokensUsed: number,
  responseTime: number
) {
  logger.info({
    type: 'ai_usage',
    userId,
    model,
    promptType,
    tokensUsed,
    responseTime,
  }, `AI: ${model} - ${promptType} (${tokensUsed} tokens, ${responseTime}ms)`)
}
