'use client';

import { useEffect } from 'react';
import { initializeNewRelic, NewRelic } from '@/lib/monitoring/newrelic';

export function NewRelicProvider() {
  useEffect(() => {
    // Initialize New Relic monitoring
    initializeNewRelic();
    
    // Record app launch event
    NewRelic.recordAppEvent('app_launched', {
      platform: 'web',
      version: '3.1.0',
      environment: process.env.NODE_ENV || 'development',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      timestamp: Date.now()
    });

    // Track visibility changes
    const handleVisibilityChange = () => {
      NewRelic.recordAppEvent('visibility_changed', {
        isVisible: document.visibilityState === 'visible',
        visibilityState: document.visibilityState,
        timestamp: Date.now()
      });
    };

    // Track page unload for session tracking
    const handleBeforeUnload = () => {
      NewRelic.recordAppEvent('app_closing', {
        timestamp: Date.now(),
        sessionDuration: Date.now() - parseInt(sessionStorage.getItem('app_start_time') || '0')
      });
    };

    // Track network status changes
    const handleOnline = () => {
      NewRelic.recordAppEvent('connection_restored', {
        timestamp: Date.now(),
        navigator_online: navigator.onLine
      });
    };

    const handleOffline = () => {
      NewRelic.recordAppEvent('connection_lost', {
        timestamp: Date.now(),
        navigator_online: navigator.onLine
      });
    };

    // Store app start time for session duration tracking
    sessionStorage.setItem('app_start_time', Date.now().toString());

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Performance monitoring
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          NewRelic.recordPerformanceMetric('page_load_time', entry.duration, {
            metric_type: 'navigation',
            page_url: window.location.href
          });
        } else if (entry.entryType === 'largest-contentful-paint') {
          NewRelic.recordPerformanceMetric('largest_contentful_paint', entry.startTime, {
            metric_type: 'lcp',
            page_url: window.location.href
          });
        } else if (entry.entryType === 'first-input') {
          // First Input Delay tracking with proper type checking
          const fidEntry = entry as any; // PerformanceEventTiming
          if (fidEntry.processingStart) {
            NewRelic.recordPerformanceMetric('first_input_delay', fidEntry.processingStart - entry.startTime, {
              inputType: fidEntry.name || 'unknown',
              timestamp: entry.startTime
            });
          }
        }
      });
    });

    // Observe different performance metrics
    try {
      observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint', 'first-input'] });
    } catch (e) {
      // Some browsers might not support all entry types
      console.warn('Performance Observer not fully supported:', e);
    }

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      observer.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
}