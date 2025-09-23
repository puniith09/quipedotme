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
  
  // Additional location inference without consent
  const inferredLocation = {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    locale: nav.language,
    currency: getCurrencyFromLocale(),
    // Prioritize browser locale for country detection over IP
    browserCountry: Intl.DateTimeFormat().resolvedOptions().locale?.split('-')[1] || null,
    // Infer region from timezone
    inferredRegion: getRegionFromTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone),
    // Get likely country from timezone (more accurate for Indian users)
    inferredCountry: getCountryFromTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone),
    // Smart country detection: prefer timezone/locale over IP if they indicate India
    smartCountry: getSmartCountryDetection(nav.language, Intl.DateTimeFormat().resolvedOptions().timeZone, locationData.country)
  };
  
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
    
    // Network Provider Detection (sync version)
    networkProvider: getNetworkProvider(),
    connectionType: getConnectionType(connection),
    estimatedISP: getISPFromConnection(connection),
    cachedNetworkInfo: getCachedNetworkProvider(),
    
    // Page Information
    url: window.location.href,
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    referrer: document.referrer,
    
    // Session Information
    sessionId,
    userId,
    timestamp: Date.now(),
    dateIST: formatIndianDate(),
    timeIST: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
    
    // Feature Detection
    hasLocalStorage: typeof(Storage) !== "undefined",
    hasSessionStorage: typeof(Storage) !== "undefined",
    hasWebGL: !!window.WebGLRenderingContext,
    hasTouchScreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    hasGeolocation: !!navigator.geolocation,
    
    // PWA Detection
    isPWAInstalled: getPWAInstallationStatus(),
    displayMode: getPWADisplayMode(),
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    hasServiceWorker: 'serviceWorker' in navigator,
    isInWebAppiOSCapable: (window.navigator as any).standalone === true,
    
    // Performance Timing
    loadTime: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : null,
    domContentLoadedTime: performance.timing ? performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart : null,
    
    // Derived Metrics
    deviceCategory: /Mobile|Android|iPhone|iPod|BlackBerry|Opera Mini/i.test(nav.userAgent) ? 'mobile' : 
                   /iPad|Android/i.test(nav.userAgent) && !/Mobile/i.test(nav.userAgent) ? 'tablet' : 'desktop',
    screenSize: `${screen.width}x${screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    browserEngine: `${getBrowserName()} ${getBrowserVersion()}`,
    
    // Location Data (mixed: IP-based + inferred + optional GPS)
    ...locationData,
    ...inferredLocation
  };
};

const getUserMetrics = () => {
  if (typeof window === 'undefined') return {};
  
  const data = JSON.parse(sessionStorage.getItem('quipe_session_data') || '{}');
  const now = Date.now();
  data.pageViews = (data.pageViews || 0) + 1;
  data.sessionStart = data.sessionStart || now;
  data.totalEvents = (data.totalEvents || 0) + 1;
  data.lastActivity = now;
  sessionStorage.setItem('quipe_session_data', JSON.stringify(data));
  
  const visitCount = parseInt(localStorage.getItem('quipe_visit_count') || '0');
  
  return {
    sessionDuration: now - data.sessionStart,
    pageViews: data.pageViews,
    totalEvents: data.totalEvents,
    isReturningUser: !!localStorage.getItem('quipe_user_id'),
    visitCount: visitCount,
    lastActivity: data.lastActivity,
    sessionAge: now - data.sessionStart,
    avgTimePerPage: data.pageViews > 0 ? (now - data.sessionStart) / data.pageViews : 0
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

const requestLocationData = async () => {
  if (typeof window === 'undefined') return;
  
  try {
    // First try to get IP-based location (no permission needed)
    const ipLocationResponse = await fetch('/api/location');
    if (ipLocationResponse.ok) {
      const ipLocation = await ipLocationResponse.json();
      const locationData = {
        ...ipLocation,
        source: 'ip_geolocation',
        timestamp: Date.now(),
        locationDateIST: formatIndianDate(),
        locationTimeIST: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
      };
      sessionStorage.setItem('quipe_location_data', JSON.stringify(locationData));
      console.log('📍 IP-based location collected:', ipLocation);
      return;
    }
  } catch (error) {
    console.warn('Failed to get IP location:', error);
  }
  
  // Fallback to GPS location (requires permission) - optional
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'gps',
          timestamp: Date.now(),
          locationDateIST: formatIndianDate(),
          locationTimeIST: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
        };
        
        // Merge with any existing IP location data
        const existing = getLocationData();
        const merged = { ...existing, ...locationData };
        sessionStorage.setItem('quipe_location_data', JSON.stringify(merged));
        console.log('📍 GPS location collected:', locationData);
      },
      () => {
        // GPS denied - IP location is still available
        console.log('📍 GPS location denied, using IP location only');
      },
      { timeout: 5000, maximumAge: 300000 } // 5 minute cache
    );
  }
};

const getBrowserName = () => {
  if (typeof window === 'undefined') return 'Unknown';
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

const getCurrencyFromLocale = () => {
  if (typeof window === 'undefined') return null;
  try {
    const locale = navigator.language;
    // Common currency mappings for major locales
    const currencyMap: { [key: string]: string } = {
      'en-US': 'USD', 'en-GB': 'GBP', 'en-IN': 'INR', 'en-AU': 'AUD', 'en-CA': 'CAD',
      'de-DE': 'EUR', 'fr-FR': 'EUR', 'es-ES': 'EUR', 'it-IT': 'EUR', 'nl-NL': 'EUR',
      'ja-JP': 'JPY', 'ko-KR': 'KRW', 'zh-CN': 'CNY', 'pt-BR': 'BRL', 'ru-RU': 'RUB'
    };
    return currencyMap[locale] || locale.includes('IN') ? 'INR' : null;
  } catch (e) {
    return null;
  }
};

const getRegionFromTimezone = (timezone: string) => {
  if (!timezone) return null;
  const parts = timezone.split('/');
  return parts.length > 1 ? parts[0] : null; // e.g., 'Asia' from 'Asia/Kolkata'
};

const getCountryFromTimezone = (timezone: string) => {
  if (!timezone) return null;
  // Common timezone to country mappings
  const timezoneCountryMap: { [key: string]: string } = {
    'Asia/Kolkata': 'IN', 'Asia/Mumbai': 'IN', 'Asia/Delhi': 'IN',
    'America/New_York': 'US', 'America/Los_Angeles': 'US', 'America/Chicago': 'US',
    'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE',
    'Asia/Tokyo': 'JP', 'Asia/Shanghai': 'CN', 'Asia/Seoul': 'KR',
    'Australia/Sydney': 'AU', 'Pacific/Auckland': 'NZ'
  };
  return timezoneCountryMap[timezone] || null;
};

const getSmartCountryDetection = (language: string, timezone: string, ipCountry: string | null) => {
  // If timezone indicates India, prefer that over IP location
  if (timezone === 'Asia/Kolkata' || timezone === 'Asia/Mumbai' || timezone === 'Asia/Delhi') {
    return 'IN';
  }
  
  // If browser language indicates India, prefer that
  if (language.includes('IN') || language.startsWith('hi') || language.startsWith('ta') || language.startsWith('te')) {
    return 'IN';
  }
  
  // If timezone is Asian but IP says US, user might be using VPN - prefer timezone
  if (timezone.startsWith('Asia/') && ipCountry === 'US') {
    const timezoneCountry = getCountryFromTimezone(timezone);
    if (timezoneCountry) return timezoneCountry;
  }
  
  // Fall back to IP country
  return ipCountry;
};

const getPWAInstallationStatus = () => {
  if (typeof window === 'undefined') return false;
  
  // Check if running in standalone mode (installed PWA)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check iOS Safari standalone mode
  if ((window.navigator as any).standalone === true) {
    return true;
  }
  
  // Check if launched from home screen (Android)
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return true;
  }
  
  return false;
};

const getPWADisplayMode = () => {
  if (typeof window === 'undefined') return 'browser';
  
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  return 'browser';
};

const getNetworkProvider = () => {
  if (typeof window === 'undefined') return null;
  
  // Try to get carrier info from mobile network API (limited support)
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (connection) {
    // Some Android devices expose carrier info
    if ((connection as any).carrier) {
      return (connection as any).carrier;
    }
  }
  
  // Fallback: Use IP-based provider detection via API
  getNetworkProviderAsync();
  return null;
};

const getConnectionType = (connection: any) => {
  if (!connection) return 'unknown';
  
  if (connection.effectiveType) {
    return connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'
  }
  
  if (connection.type) {
    return connection.type; // 'wifi', 'cellular', 'bluetooth', 'ethernet'
  }
  
  return 'unknown';
};

const getISPFromConnection = (connection: any) => {
  if (!connection) return null;
  
  // Estimate ISP type based on connection characteristics
  if (connection.effectiveType === '4g' && connection.downlink > 10) {
    return 'fiber_or_5g';
  } else if (connection.effectiveType === '4g') {
    return 'broadband_4g';
  } else if (connection.effectiveType === '3g') {
    return 'mobile_3g';
  } else if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
    return 'mobile_2g';
  }
  
  return 'unknown';
};

const getNetworkProviderAsync = async () => {
  // Asynchronously fetch network provider info and cache it
  try {
    const cached = sessionStorage.getItem('quipe_network_provider');
    if (cached) return;
    
    // Try to get ISP info from our location API (which includes network data)
    const response = await fetch('/api/location');
    if (response.ok) {
      const data = await response.json();
      if (data.isp || data.org) {
        const providerInfo = {
          isp: data.isp || data.org,
          asn: data.as,
          timestamp: Date.now()
        };
        sessionStorage.setItem('quipe_network_provider', JSON.stringify(providerInfo));
      }
    }
  } catch (error) {
    // Silent error handling for network provider detection
  }
};

const getCachedNetworkProvider = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = sessionStorage.getItem('quipe_network_provider');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    // Silent error handling
  }
  
  return null;
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