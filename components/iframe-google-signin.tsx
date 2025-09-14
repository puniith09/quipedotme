'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { useSession } from 'next-auth/react';

export function IframeGoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { data: session, update } = useSession();

  const handleSignIn = () => {
    setIsLoading(true);
    setShowIframe(true);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our own origin
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'AUTH_SUCCESS') {
        setIsLoading(false);
        setShowIframe(false);
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
        setShowIframe(false);
        console.error('Authentication error:', event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [update]);

  const closeIframe = () => {
    setShowIframe(false);
    setIsLoading(false);
  };

  return (
    <>
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

      {showIframe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 relative">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Sign in with Google</h3>
              <button
                onClick={closeIframe}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <iframe
                ref={iframeRef}
                src={`/api/auth/signin/google?callbackUrl=${encodeURIComponent(window.location.origin + '/auth/iframe-callback')}`}
                className="w-full h-96 border-0 rounded"
                title="Google Sign In"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}