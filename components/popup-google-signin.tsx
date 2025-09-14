'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useSession } from 'next-auth/react';

export function PopupGoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { update } = useSession();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our own origin
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'AUTH_SUCCESS') {
        setIsLoading(false);
        // Refresh session to get updated user data
        update();
        
        // Dispatch event to continue onboarding
        window.dispatchEvent(new CustomEvent('continueOnboarding', {
          detail: { 
            user: event.data.user,
            success: true
          }
        }));
      } else if (event.data.type === 'AUTH_ERROR') {
        setIsLoading(false);
        console.error('Authentication error:', event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [update]);

  const handleSignIn = () => {
    setIsLoading(true);
    
    // Calculate popup position (centered)
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    // Open popup window for authentication
    const popup = window.open(
      `/api/auth/signin/google?callbackUrl=${encodeURIComponent(window.location.origin + '/auth/popup-success')}`,
      'google-signin',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      setIsLoading(false);
      alert('Popup was blocked. Please allow popups for this site and try again.');
      return;
    }

    // Check if popup was closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleSignIn}
      disabled={isLoading}
      className="w-full"
    >
      <svg
        className="mr-2 h-4 w-4"
        aria-hidden="true"
        focusable="false"
        data-prefix="fab"
        data-icon="google"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 488 512"
      >
        <path
          fill="currentColor"
          d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h240z"
        />
      </svg>
      {isLoading ? 'Signing in...' : 'Continue with Google'}
    </Button>
  );
}