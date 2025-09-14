// New Relic Browser monitoring for Next.js application
// Enhanced monitoring with comprehensive browser info and performance tracking

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

// Get comprehensive browser and device information
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
    
    // Browser Type Detection
    browserName: getBrowserName(),
    browserVersion: getBrowserVersion(),
    isMobile: /Mobile|Android|iPhone|iPad|iPod|BlackBerry|Opera Mini/i.test(nav.userAgent),
    isTablet: /iPad|Android/i.test(nav.userAgent) && !/Mobile/i.test(nav.userAgent),
    
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
    
    // Timezone
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    
    // Page Information
    url: window.location.href,
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    referrer: document.referrer,
    
    // Session Information
    sessionId: sessionId,
    userId: userId,
    timestamp: Date.now(),
    
    // Feature Detection
    localStorage: typeof(Storage) !== "undefined",
    sessionStorage: typeof(Storage) !== "undefined",
    webGL: !!window.WebGLRenderingContext,
    touchScreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    geolocation: !!navigator.geolocation,
    
    // Performance Timing
    loadTime: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : null,
    domContentLoadedTime: performance.timing ? performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart : null
  };
};

const getBrowserName = () => {
  if (typeof window === 'undefined') return 'Server';
  
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) return 'Chrome';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  if (userAgent.includes('MSIE')) return 'Internet Explorer';
  return 'Unknown';
};

const getBrowserVersion = () => {
  if (typeof window === 'undefined') return 'Unknown';
  
  const userAgent = navigator.userAgent;
  const match = userAgent.match(/(chrome|safari|firefox|msie|edge|opera)\/?\s*(\d+)/i);
  return match ? match[2] : 'Unknown';
};

// Track user engagement metrics
const getUserEngagementMetrics = () => {
  if (typeof window === 'undefined') {
    return {
      sessionDuration: 0,
      pageViews: 0,
      totalEvents: 0,
      isReturningUser: false,
      visitCount: 0
    };
  }

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
  // Only initialize for browser environment
  if (typeof window === 'undefined') {
    return;
  }

  const licenseKey = process.env.NEXT_PUBLIC_NEWRELIC_BROWSER_LICENSE_KEY;
  const applicationId = process.env.NEXT_PUBLIC_NEWRELIC_APPLICATION_ID;
  const accountId = process.env.NEXT_PUBLIC_NEWRELIC_ACCOUNT_ID;

  if (!licenseKey || !applicationId || !accountId) {
    console.warn('New Relic configuration missing. Monitoring disabled.');
    return;
  }

  // Initialize session and user IDs
  sessionId = generateSessionId();
  userId = generateUserId();
  
  // Update visit count
  const visitCount = parseInt(localStorage.getItem('quipe_visit_count') || '0') + 1;
  localStorage.setItem('quipe_visit_count', visitCount.toString());

  // Browser monitoring initialization script with CORS-friendly configuration
  const initScript = document.createElement('script');
  initScript.type = 'text/javascript';
  initScript.innerHTML = `
    ;window.NREUM||(NREUM={});
    NREUM.init={
      distributed_tracing:{enabled:true},
      privacy:{cookies_enabled:true},
      ajax:{
        deny_list:[],
        block_internal:false,
        enabled:true,
        harvestTimeSeconds:10,
        autoStart:true
      },
      page_view_event:{enabled:true},
      page_action:{enabled:true}
    };
    NREUM.loader_config={
      accountID:"${accountId}",
      trustKey:"${accountId}",
      agentID:"${applicationId}",
      licenseKey:"${licenseKey}",
      applicationID:"${applicationId}",
      xpid:"VQ4GVV5SCRAEVlNTBwgBVw=="
    };
    NREUM.info={
      beacon:"bam-cell.nr-data.net",
      errorBeacon:"bam-cell.nr-data.net",
      licenseKey:"${licenseKey}",
      applicationID:"${applicationId}",
      sa:1
    };
  `;
  document.head.appendChild(initScript);

  // Load the actual New Relic agent with better error handling
  const agentScript = document.createElement('script');
  agentScript.src = 'https://js-agent.newrelic.com/nr-spa-1.293.0.min.js';
  agentScript.async = true;
  agentScript.crossOrigin = 'anonymous';
  
  agentScript.onload = () => {
    console.log('New Relic agent loaded successfully');
    // Check immediately and then poll
    if (!checkNewRelicReady()) {
      const readinessCheck = setInterval(() => {
        if (checkNewRelicReady()) {
          clearInterval(readinessCheck);
          console.log('New Relic agent is ready');
        }
      }, 100);
      
      // Stop checking after 10 seconds
      setTimeout(() => {
        clearInterval(readinessCheck);
        if (!isNewRelicReady) {
          console.warn('New Relic agent failed to initialize within timeout');
          // Try fallback initialization
          initializeFallbackNewRelic();
        }
      }, 10000);
    }
  };
  
  agentScript.onerror = () => {
    console.warn('Failed to load New Relic agent');
  };
  
  document.head.appendChild(agentScript);
};

// Fallback initialization for when the main agent fails to load
const initializeFallbackNewRelic = () => {
  console.log('Initializing fallback New Relic monitoring');
  
  // Create a minimal mock New Relic object to prevent errors
  if (!window.newrelic) {
    window.newrelic = {
      addPageAction: (name: string, attributes: any) => {
        console.log('Fallback New Relic - Page Action:', name, attributes);
        // You could send these to an alternative endpoint or queue them
      },
      noticeError: (error: Error, attributes?: any) => {
        console.log('Fallback New Relic - Error:', error, attributes);
      },
      setCustomAttribute: (name: string, value: any) => {
        console.log('Fallback New Relic - Custom Attribute:', name, value);
      }
    };
  }
  
  // Mark as ready so events can be processed
  isNewRelicReady = true;
  
  // Process any queued events
  while (eventQueue.length > 0) {
    const event = eventQueue.shift();
    if (event) {
      window.newrelic.addPageAction(event.eventName, event.attributes);
    }
  }
};

// Enhanced New Relic API for the quipedotme application
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
      isMobileDevice: browserInfo.isMobile,
      screenSize: `${browserInfo.screenWidth}x${browserInfo.screenHeight}`,
      viewportSize: `${browserInfo.viewportWidth}x${browserInfo.viewportHeight}`,
      browserEngine: `${browserInfo.browserName} ${browserInfo.browserVersion}`,
      deviceCategory: browserInfo.isMobile ? 'mobile' : browserInfo.isTablet ? 'tablet' : 'desktop'
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
  
  // Track performance metrics specific to quipedotme
  recordPerformanceMetric: (metricName: string, value: number, attributes: any = {}) => {
    NewRelic.recordCustomEvent('Performance', metricName, {
      ...attributes,
      metricValue: value,
      performanceNow: typeof window !== 'undefined' ? performance.now() : Date.now()
    });
  },
  
  // Track user journey through the chat application
  recordUserJourney: (action: string, details: any = {}) => {
    NewRelic.recordCustomEvent('UserJourney', action, {
      ...details,
      journeyStep: action,
      timestamp: Date.now()
    });
  },

  // Track chat-specific events
  recordChatEvent: (eventName: string, details: any = {}) => {
    NewRelic.recordCustomEvent('ChatInteraction', eventName, {
      ...details,
      chatEventType: eventName,
      timestamp: Date.now()
    });
  },

  // Track AI and model performance
  recordAIEvent: (eventName: string, details: any = {}) => {
    NewRelic.recordCustomEvent('AIInteraction', eventName, {
      ...details,
      aiEventType: eventName,
      timestamp: Date.now()
    });
  },

  // Track artifact creation and editing
  recordArtifactEvent: (eventName: string, details: any = {}) => {
    NewRelic.recordCustomEvent('ArtifactInteraction', eventName, {
      ...details,
      artifactEventType: eventName,
      timestamp: Date.now()
    });
  }
};