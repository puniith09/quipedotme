// New Relic Browser monitoring for Next.js application
// Based on working implementation from tmp analysis

declare global {
  interface Window {
    NREUM?: any;
    newrelic?: any;
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

export const initializeNewRelic = () => {
  // Only initialize for web platform
  if (typeof window === 'undefined') {
    return;
  }

  if (!process.env.NEXT_PUBLIC_NEWRELIC_BROWSER_LICENSE_KEY || !process.env.NEXT_PUBLIC_NEWRELIC_APPLICATION_ID) {
    return;
  }

  // Initialize session and user IDs
  sessionId = generateSessionId();
  userId = generateUserId();
  
  // Update visit count
  const visitCount = parseInt(localStorage.getItem('quipe_visit_count') || '0') + 1;
  localStorage.setItem('quipe_visit_count', visitCount.toString());

  // Browser monitoring initialization script - EXACT copy from tmp version
  const initScript = document.createElement('script');
  initScript.type = 'text/javascript';
  initScript.innerHTML = `
    ;window.NREUM||(NREUM={});NREUM.init={distributed_tracing:{enabled:true},privacy:{cookies_enabled:true},ajax:{deny_list:[]}};
    NREUM.loader_config={accountID:"${process.env.NEXT_PUBLIC_NEWRELIC_ACCOUNT_ID}",trustKey:"${process.env.NEXT_PUBLIC_NEWRELIC_ACCOUNT_ID}",agentID:"${process.env.NEXT_PUBLIC_NEWRELIC_APPLICATION_ID}",licenseKey:"${process.env.NEXT_PUBLIC_NEWRELIC_BROWSER_LICENSE_KEY}",applicationID:"${process.env.NEXT_PUBLIC_NEWRELIC_APPLICATION_ID}"};
    NREUM.info={beacon:"bam.nr-data.net",errorBeacon:"bam.nr-data.net",licenseKey:"${process.env.NEXT_PUBLIC_NEWRELIC_BROWSER_LICENSE_KEY}",applicationID:"${process.env.NEXT_PUBLIC_NEWRELIC_APPLICATION_ID}",sa:1};
  `;
  document.head.appendChild(initScript);

  // Load the actual New Relic agent - EXACT URL from tmp version
  const agentScript = document.createElement('script');
  agentScript.src = 'https://js-agent.newrelic.com/nr-loader-spa-1.293.0.min.js';
  agentScript.async = true;
  agentScript.onload = () => {
    console.log('New Relic agent loaded successfully');
    // Check immediately and then poll
    if (!checkNewRelicReady()) {
      const readinessCheck = setInterval(() => {
        if (checkNewRelicReady()) {
          clearInterval(readinessCheck);
        }
      }, 100);
      
      // Stop checking after 10 seconds
      setTimeout(() => {
        clearInterval(readinessCheck);
        if (!isNewRelicReady) {
          console.warn('New Relic agent failed to initialize within timeout');
        }
      }, 10000);
    }
  };
  
  agentScript.onerror = () => {
    console.warn('Failed to load New Relic agent');
  };
  
  document.head.appendChild(agentScript);
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