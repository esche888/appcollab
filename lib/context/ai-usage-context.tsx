'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type AIUsageContextType = {
    lastTaskTokens: number | null
    setLastTaskTokens: (tokens: number) => void
}

const AIUsageContext = createContext<AIUsageContextType | undefined>(undefined)

export function AIUsageProvider({ children }: { children: ReactNode }) {
    const [lastTaskTokens, setLastTaskTokens] = useState<number | null>(null)

    return (
        <AIUsageContext.Provider value={{ lastTaskTokens, setLastTaskTokens }}>
            {children}
        </AIUsageContext.Provider>
    )
}

export function useAIUsage() {
    const context = useContext(AIUsageContext)
    if (context === undefined) {
        throw new Error('useAIUsage must be used within an AIUsageProvider')
    }
    return context
}
