'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    newrelic?: {
      addPageAction: (name: string, attributes?: Record<string, any>) => void
      setUserId: (userId: string) => void
      setCustomAttribute: (name: string, value: string | number | boolean) => void
      noticeError: (error: Error, attributes?: Record<string, any>) => void
    }
  }
}

export function NewRelicBrowser() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return

    // Add custom attributes for better tracking
    const addCustomAttributes = () => {
      if (window.newrelic) {
        window.newrelic.setCustomAttribute('app', 'quipe-ai-chatbot')
        window.newrelic.setCustomAttribute('environment', process.env.NODE_ENV || 'development')
      }
    }

    // Initialize when New Relic is available
    if (window.newrelic) {
      addCustomAttributes()
    } else {
      // Wait for New Relic to load
      const checkNewRelic = setInterval(() => {
        if (window.newrelic) {
          addCustomAttributes()
          clearInterval(checkNewRelic)
        }
      }, 100)

      // Clean up after 5 seconds
      setTimeout(() => clearInterval(checkNewRelic), 5000)
    }
  }, [])

  return null
}

// Helper functions for tracking custom events
export const trackChatEvent = (action: string, metadata?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.newrelic) {
    window.newrelic.addPageAction(`chat_${action}`, {
      ...metadata,
      timestamp: Date.now()
    })
  }
}

export const trackUserAction = (action: string, metadata?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.newrelic) {
    window.newrelic.addPageAction(`user_${action}`, {
      ...metadata,
      timestamp: Date.now()
    })
  }
}

export const trackError = (error: Error, context?: string) => {
  if (typeof window !== 'undefined' && window.newrelic) {
    window.newrelic.noticeError(error, {
      context: context || 'unknown',
      timestamp: Date.now()
    })
  }
}