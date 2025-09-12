'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired', {
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if we should show the prompt (not temporarily dismissed)
      const tempDismissedUntil = localStorage.getItem('pwa-install-temp-dismissed');
      const shouldShow = !tempDismissedUntil || Date.now() >= parseInt(tempDismissedUntil);
      
      console.log('PWA: Should show prompt?', { shouldShow, tempDismissedUntil });
      
      if (shouldShow) {
        setShowInstallPrompt(true);
      }
    };

    const handleAppInstalled = () => {
      console.log('PWA: App installed event fired');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      // Clear any dismissal state since app is now installed
      localStorage.removeItem('pwa-install-temp-dismissed');
    };

    // Check if app is already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    console.log('PWA: Standalone mode check', { isStandaloneMode, url: window.location.href });
    
    if (isStandaloneMode) {
      setIsInstalled(true);
    }

    console.log('PWA: Setting up event listeners');
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Set up a timer to check for temporary dismissal expiry
    const checkDismissalTimer = setInterval(() => {
      const tempDismissedUntil = localStorage.getItem('pwa-install-temp-dismissed');
      if (tempDismissedUntil && Date.now() >= parseInt(tempDismissedUntil)) {
        localStorage.removeItem('pwa-install-temp-dismissed');
        // If we have a deferred prompt and app is not installed, show the prompt again
        if (deferredPrompt && !isInstalled) {
          console.log('PWA: Re-showing prompt after dismissal timeout');
          setShowInstallPrompt(true);
        }
      }
    }, 1000); // Check every second

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(checkDismissalTimer);
    };
  }, [deferredPrompt, isInstalled]);

  const handleInstallClick = async () => {
    console.log('PWA: Install button clicked', { deferredPrompt: !!deferredPrompt });
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('PWA: User choice outcome', { outcome });
      
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      } else {
        // If user dismissed the native prompt, hide temporarily but will show again on next visit
        setShowInstallPrompt(false);
        // Store a short-term dismissal (30 seconds) to avoid immediate re-showing
        const dismissUntil = Date.now() + 30000;
        localStorage.setItem('pwa-install-temp-dismissed', dismissUntil.toString());
        console.log('PWA: Temporarily dismissed until', new Date(dismissUntil));
      }
    } catch (error) {
      console.error('PWA: Error during install prompt', error);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    console.log('PWA: Dismiss button clicked');
    setShowInstallPrompt(false);
    // Only temporarily hide for 30 seconds instead of 7 days
    const dismissUntil = Date.now() + 30000;
    localStorage.setItem('pwa-install-temp-dismissed', dismissUntil.toString());
    console.log('PWA: Temporarily dismissed until', new Date(dismissUntil));
  };

  // Don't show if already installed
  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  // Check if user dismissed recently (only 30 seconds temporary dismissal)
  const tempDismissedUntil = localStorage.getItem('pwa-install-temp-dismissed');
  if (tempDismissedUntil && Date.now() < parseInt(tempDismissedUntil)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="flex items-center gap-3 rounded-lg border bg-background p-4 shadow-lg">
        <Download className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">Install Quipe Chat</p>
          <p className="text-xs text-muted-foreground">
            Add to home screen for quick access
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleInstallClick}>
            Install
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}