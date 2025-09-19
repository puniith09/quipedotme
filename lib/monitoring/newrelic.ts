// New Relic monitoring for quipedotme
declare global {
  interface Window {
    newrelic?: any;
    _nrCustomAttributes?: Record<string, any>;
  }
}

let sessionId: string;
let userId: string;

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
    sessionId,
    userId,
    timestamp: Date.now(),
    loadTime: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : null,
    domContentLoadedTime: performance.timing ? performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart : null
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

async function sendEvent(eventType: string, eventName: string, attributes: any) {
  if (typeof window === 'undefined') return;
  
  try {
    const payload = {
      eventType,
      actionName: eventName,
      appName: 'quipedotme',
      appId: 601584297,
      ...getBrowserInfo(),
      ...getUserMetrics(),
      ...attributes
    };

    await fetch('https://insights-collector.newrelic.com/v1/accounts/7120052/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Insert-Key': '60c45774c4a25f32ca29ae52adffd4520289NRAL'
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