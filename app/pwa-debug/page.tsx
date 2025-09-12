'use client';

import { useEffect, useState } from 'react';

export default function PWADebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const checkPWAStatus = async () => {
      const info: any = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        isHTTPS: window.location.protocol === 'https:',
        isStandalone: window.matchMedia('(display-mode: standalone)').matches,
        serviceWorker: {
          supported: 'serviceWorker' in navigator,
          registered: false,
          registrations: [],
        },
        manifest: {
          supported: 'manifest' in document.createElement('link'),
          found: false,
          content: null,
        },
        beforeInstallPrompt: {
          fired: false,
          stored: !!window.localStorage.getItem('pwa-install-temp-dismissed'),
          tempDismissedUntil: window.localStorage.getItem('pwa-install-temp-dismissed'),
        },
      };

      // Check Service Worker
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          info.serviceWorker.registered = registrations.length > 0;
          info.serviceWorker.registrations = registrations.map(reg => ({
            scope: reg.scope,
            state: reg.active?.state,
            scriptURL: reg.active?.scriptURL,
          }));
        } catch (error) {
          info.serviceWorker.error = error.message;
        }
      }

      // Check Manifest
      try {
        const manifestResponse = await fetch('/manifest.json');
        if (manifestResponse.ok) {
          info.manifest.found = true;
          info.manifest.content = await manifestResponse.json();
        }
      } catch (error) {
        info.manifest.error = error.message;
      }

      // Check beforeinstallprompt event
      let beforeInstallPromptFired = false;
      const handleBeforeInstallPrompt = (e: Event) => {
        beforeInstallPromptFired = true;
        info.beforeInstallPrompt.fired = true;
        setDebugInfo({ ...info });
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Wait a bit to see if the event fires
      setTimeout(() => {
        if (!beforeInstallPromptFired) {
          info.beforeInstallPrompt.fired = false;
          info.beforeInstallPrompt.reason = 'Event did not fire within 5 seconds';
        }
        setDebugInfo(info);
      }, 5000);

      setDebugInfo(info);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    };

    checkPWAStatus();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">PWA Debug Information</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Basic Info</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              url: debugInfo.url,
              isHTTPS: debugInfo.isHTTPS,
              isStandalone: debugInfo.isStandalone,
              timestamp: debugInfo.timestamp,
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Service Worker</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(debugInfo.serviceWorker, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Manifest</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(debugInfo.manifest, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Install Prompt</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(debugInfo.beforeInstallPrompt, null, 2)}
          </pre>
        </div>

        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Manual Tests</h2>
          <div className="space-y-2 text-sm">
            <p>• Open Chrome DevTools → Application → Manifest</p>
            <p>• Check if manifest is detected and valid</p>
            <p>• Open Chrome DevTools → Application → Service Workers</p>
            <p>• Verify service worker is registered and running</p>
            <p>• Open Chrome DevTools → Console</p>
            <p>• Look for any PWA-related errors</p>
            <p>• Check Lighthouse PWA audit score</p>
          </div>
        </div>

        <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Common Issues</h2>
          <div className="space-y-2 text-sm">
            <p>• <strong>Domain not HTTPS:</strong> PWAs require HTTPS</p>
            <p>• <strong>Already installed:</strong> Browser won't show prompt if already installed</p>
            <p>• <strong>Browser cache:</strong> Clear cache and hard refresh</p>
            <p>• <strong>User engagement:</strong> Some browsers require user interaction first</p>
            <p>• <strong>Browser support:</strong> Install prompts work differently across browsers</p>
          </div>
        </div>
      </div>
    </div>
  );
}