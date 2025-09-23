// New Relic monitoring for quipedotme
declare global {
  interface Window {
    newrelic?: any;
    _nrCustomAttributes?: Record<string, any>;
  }
}

let sessionId: string;
let userId: string;

const formatIndianDate = (timestamp?: number) => {
  const date = timestamp ? new Date(timestamp) : new Date();
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Kolkata'
  });
};

const generateSessionId = () => 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

const generateUserId = () => {
  if (typeof window === 'undefined') return 'server_user';
  let stored = localStorage.getItem('quipe_user_id');
  if (!stored) {
    stored = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('quipe_user_id', stored);
  }
  return stored;
};

const getBrowserInfo = () => {
  if (typeof window === 'undefined') return { environment: 'server', sessionId, userId };
  
  const nav = navigator;
  const screen = window.screen;
  const connection = (nav as any).connection || (nav as any).mozConnection || (nav as any).webkitConnection;
  const locationData = getLocationData();
  
  return {
    userAgent: nav.userAgent,
    platform: nav.platform,
    language: nav.language,
    languages: nav.languages?.join(',') || nav.language,
    cookieEnabled: nav.cookieEnabled,
    onLine: nav.onLine,
    screenWidth: screen.width,
    screenHeight: screen.height,
    screenColorDepth: screen.colorDepth,
    screenPixelDepth: screen.pixelDepth,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    memory: (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
    } : null,
    connection: connection ? {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    } : null,
    url: window.location.href,
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    referrer: document.referrer,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    locale: nav.language,
    country: Intl.DateTimeFormat().resolvedOptions().locale?.split('-')[1] || null,
    sessionId,
    userId,
    timestamp: Date.now(),
    dateIST: formatIndianDate(),
    timeIST: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
    loadTime: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : null,
    domContentLoadedTime: performance.timing ? performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart : null,
    ...locationData
  };
};

const getUserMetrics = () => {
  if (typeof window === 'undefined') return {};
  
  const data = JSON.parse(sessionStorage.getItem('quipe_session_data') || '{}');
  const now = Date.now();
  data.pageViews = (data.pageViews || 0) + 1;
  data.sessionStart = data.sessionStart || now;
  data.totalEvents = (data.totalEvents || 0) + 1;
  sessionStorage.setItem('quipe_session_data', JSON.stringify(data));
  
  return {
    sessionDuration: now - data.sessionStart,
    pageViews: data.pageViews,
    totalEvents: data.totalEvents,
    isReturningUser: !!localStorage.getItem('quipe_user_id'),
    visitCount: parseInt(localStorage.getItem('quipe_visit_count') || '0') + 1,
    isMobileDevice: /Mobile|Android|iPhone|iPad|iPod|BlackBerry|Opera Mini/i.test(navigator.userAgent)
  };
};

const getLocationData = () => {
  const cached = sessionStorage.getItem('quipe_location_data');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      return {};
    }
  }
  return {};
};

const requestLocationData = () => {
  if (typeof window === 'undefined' || !navigator.geolocation) return;
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
        locationDateIST: formatIndianDate(),
        locationTimeIST: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
      };
      sessionStorage.setItem('quipe_location_data', JSON.stringify(locationData));
    },
    () => {
      // Location denied or failed - store empty data to avoid repeated requests
      sessionStorage.setItem('quipe_location_data', JSON.stringify({ denied: true }));
    },
    { timeout: 10000, maximumAge: 300000 } // 5 minute cache
  );
};

async function sendEvent(eventType: string, eventName: string, attributes: any) {
  if (typeof window === 'undefined') return;
  
  const apiKey = process.env.NEXT_PUBLIC_NEWRELIC_BROWSER_LICENSE_KEY;
  const accountId = process.env.NEXT_PUBLIC_NEWRELIC_ACCOUNT_ID;
  const appId = process.env.NEXT_PUBLIC_NEWRELIC_APPLICATION_ID;
  
  if (!apiKey || !accountId) {
    console.warn('New Relic configuration incomplete');
    return;
  }
  
  try {
    const payload = {
      eventType,
      actionName: eventName,
      appName: 'quipedotme',
      appId: appId ? parseInt(appId) : undefined,
      eventDateIST: formatIndianDate(),
      eventTimeIST: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      ...getBrowserInfo(),
      ...getUserMetrics(),
      ...attributes
    };

    await fetch(`https://insights-collector.newrelic.com/v1/accounts/${accountId}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Insert-Key': apiKey
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.warn('New Relic error:', error);
  }
}

export const initializeNewRelic = () => {
  if (typeof window === 'undefined') return;

  sessionId = generateSessionId();
  userId = generateUserId();
  
  const visitCount = parseInt(localStorage.getItem('quipe_visit_count') || '0') + 1;
  localStorage.setItem('quipe_visit_count', visitCount.toString());

  // Request location data for analytics (with user permission)
  requestLocationData();

  window.newrelic = {
    addPageAction: (name: string, attributes: any) => sendEvent('BrowserPageAction', name, attributes),
    noticeError: (error: Error, attributes?: any) => sendEvent('BrowserError', 'error', { 
      errorMessage: error.message, 
      errorStack: error.stack,
      ...attributes 
    }),
    setCustomAttribute: (name: string, value: any) => {
      if (!window._nrCustomAttributes) window._nrCustomAttributes = {};
      window._nrCustomAttributes[name] = value;
    }
  };
};

export const NewRelic = {
  recordAppEvent: (eventName: string, attributes: any = {}) => 
    sendEvent('AppLifecycle', eventName, attributes),
  
  recordBrowserEvent: (eventName: string, attributes: any = {}) => 
    sendEvent('BrowserPageAction', eventName, attributes),
  
  recordError: (name: string, message: string, attributes?: any) => 
    sendEvent('BrowserError', name, { errorMessage: message, ...attributes })
};