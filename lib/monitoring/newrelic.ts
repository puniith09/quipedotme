// New Relic Browser monitoring for Next.js application
// Based on working implementation from tmp analysis

declare global {
  interface Window {
    NREUM?: any;
    newrelic?: any;
    _nrCustomAttributes?: Record<string, any>;
  }
}

let isNewRelicReady = false;
let eventQueue: Array<{ eventType: string; eventName: string; attributes: any }> = [];
let sessionId: string;
let userId: string;

// Generate session and user IDs
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const generateUserId = () => {
  if (typeof window === 'undefined') return 'server_user';
  
  let stored = localStorage.getItem('quipe_user_id');
  if (!stored) {
    stored = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('quipe_user_id', stored);
  }
  return stored;
};

// Get comprehensive browser and device information - simplified version
const getBrowserInfo = () => {
  if (typeof window === 'undefined') {
    return {
      environment: 'server',
      timestamp: Date.now(),
      sessionId: sessionId || 'server_session',
      userId: userId || 'server_user'
    };
  }

  const nav = navigator;
  const screen = window.screen;
  const connection = (nav as any).connection || (nav as any).mozConnection || (nav as any).webkitConnection;
  
  return {
    // Browser Details
    userAgent: nav.userAgent,
    platform: nav.platform,
    language: nav.language,
    languages: nav.languages?.join(',') || nav.language,
    cookieEnabled: nav.cookieEnabled,
    onLine: nav.onLine,
    
    // Screen Information
    screenWidth: screen.width,
    screenHeight: screen.height,
    screenColorDepth: screen.colorDepth,
    screenPixelDepth: screen.pixelDepth,
    
    // Viewport Information
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    
    // Performance Information
    memory: (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
    } : null,
    
    // Network Information
    connection: connection ? {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    } : null,
    
    // Page Information
    url: window.location.href,
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    referrer: document.referrer,
    
    // Session Information
    sessionId: sessionId,
    userId: userId,
    timestamp: Date.now(),
    
    // Performance Timing
    loadTime: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : null,
    domContentLoadedTime: performance.timing ? performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart : null
  };
};

// Track user engagement metrics
const getUserEngagementMetrics = () => {
  if (typeof window === 'undefined') return {};
  
  const sessionData = JSON.parse(sessionStorage.getItem('quipe_session_data') || '{}');
  const now = Date.now();
  
  // Update session data
  sessionData.lastActivity = now;
  sessionData.pageViews = (sessionData.pageViews || 0) + 1;
  sessionData.sessionStart = sessionData.sessionStart || now;
  sessionData.totalEvents = (sessionData.totalEvents || 0) + 1;
  
  sessionStorage.setItem('quipe_session_data', JSON.stringify(sessionData));
  
  return {
    sessionDuration: now - sessionData.sessionStart,
    pageViews: sessionData.pageViews,
    totalEvents: sessionData.totalEvents,
    isReturningUser: !!localStorage.getItem('quipe_user_id'),
    visitCount: parseInt(localStorage.getItem('quipe_visit_count') || '0') + 1
  };
};

// Check if New Relic is ready every 100ms
const checkNewRelicReady = () => {
  if (typeof window !== 'undefined' && window.newrelic && window.newrelic.addPageAction) {
    isNewRelicReady = true;
    
    // Set user attributes
    const browserInfo = getBrowserInfo();
    Object.entries(browserInfo).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        try {
          window.newrelic.setCustomAttribute(key, value);
        } catch (e) {
          // Some values might be too complex for New Relic
        }
      }
    });
    
    // Process any queued events
    while (eventQueue.length > 0) {
      const event = eventQueue.shift();
      if (event) {
        try {
          window.newrelic.addPageAction(event.eventName, event.attributes);
        } catch (error) {
          // Silent error handling
        }
      }
    }
    return true;
  }
  return false;
};

// Send events directly to New Relic Events API (EXACT same as Node.js script)
async function sendEventToAPI(eventType: string, eventName: string, attributes: any) {
  try {
    const browserInfo = getBrowserInfo();
    const payload = {
      eventType: eventType,
      actionName: eventName,
      appName: 'quipedotme',
      appId: 601584297,
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...browserInfo,
      ...(window._nrCustomAttributes || {}),
      ...attributes
    };

    const response = await fetch('https://insights-collector.newrelic.com/v1/accounts/7120052/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Insert-Key': '60c45774c4a25f32ca29ae52adffd4520289NRAL',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Event sent to New Relic:', eventName, result);
    } else {
      console.warn('⚠️ Failed to send event to New Relic:', response.status);
    }
  } catch (error) {
    console.warn('⚠️ Error sending event to New Relic:', error);
  }
}

export const initializeNewRelic = () => {
  // Only initialize for web platform
  if (typeof window === 'undefined') {
    return;
  }

  // Initialize session and user IDs
  sessionId = generateSessionId();
  userId = generateUserId();
  
  // Update visit count
  const visitCount = parseInt(localStorage.getItem('quipe_visit_count') || '0') + 1;
  localStorage.setItem('quipe_visit_count', visitCount.toString());

  // Create simple newrelic object using Events API (same as our working Node.js script)
  window.newrelic = {
    addPageAction: (name: string, attributes: any) => {
      sendEventToAPI('BrowserPageAction', name, attributes);
    },
    noticeError: (error: Error, attributes?: any) => {
      sendEventToAPI('BrowserError', 'error', { 
        errorMessage: error.message, 
        errorStack: error.stack,
        ...attributes 
      });
    },
    setCustomAttribute: (name: string, value: any) => {
      // Store for next event
      if (!window._nrCustomAttributes) window._nrCustomAttributes = {};
      window._nrCustomAttributes[name] = value;
    }
  };
  
  isNewRelicReady = true;
  console.log('✅ New Relic Events API initialized');
  
  // Process any queued events
  while (eventQueue.length > 0) {
    const event = eventQueue.shift();
    if (event) {
      window.newrelic.addPageAction(event.eventName, event.attributes);
    }
  }
};

// Enhanced browser monitoring API - simplified to match tmp version
export const NewRelic = {
  recordCustomEvent: (eventType: string, eventName: string, customAttributes: any = {}) => {
    if (typeof window === 'undefined') {
      return;
    }
    
    // Combine custom attributes with comprehensive browser info
    const browserInfo = getBrowserInfo();
    const engagementMetrics = getUserEngagementMetrics();
    
    const fullAttributes = {
      ...customAttributes,
      ...browserInfo,
      ...engagementMetrics,
      eventType,
      eventTimestamp: Date.now(),
      // Add some derived metrics
      isMobileDevice: /Mobile|Android|iPhone|iPad|iPod|BlackBerry|Opera Mini/i.test(navigator.userAgent),
      screenSize: `${browserInfo.screenWidth}x${browserInfo.screenHeight}`,
      viewportSize: `${browserInfo.viewportWidth}x${browserInfo.viewportHeight}`
    };
    
    if (!isNewRelicReady) {
      eventQueue.push({ eventType, eventName, attributes: fullAttributes });
      return;
    }
    
    try {
      window.newrelic.addPageAction(eventName, fullAttributes);
    } catch (error) {
      console.warn('New Relic event recording failed:', error);
    }
  },
  
  recordError: (name: string, message: string, attributes?: any) => {
    if (typeof window !== 'undefined' && window.newrelic && isNewRelicReady) {
      const errorAttributes = {
        ...attributes,
        ...getBrowserInfo(),
        errorTimestamp: Date.now()
      };
      window.newrelic.noticeError(new Error(message), errorAttributes);
    }
  },
  
  setAttribute: (name: string, value: any) => {
    if (typeof window !== 'undefined' && window.newrelic && isNewRelicReady) {
      window.newrelic.setCustomAttribute(name, value);
    }
  },
  
  // New method to track performance metrics
  recordPerformanceMetric: (metricName: string, value: number, attributes: any = {}) => {
    NewRelic.recordCustomEvent('Performance', metricName, {
      ...attributes,
      metricValue: value,
      performanceNow: performance.now()
    });
  },
  
  // Method to track user journey
  recordUserJourney: (action: string, details: any = {}) => {
    NewRelic.recordCustomEvent('UserJourney', action, {
      ...details,
      journeyStep: action,
      timestamp: Date.now()
    });
  }
};