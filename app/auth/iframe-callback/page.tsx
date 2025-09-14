'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function IframeCallbackPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    const sendMessageToParent = (type: string, data?: any) => {
      if (window.parent !== window) {
        window.parent.postMessage({
          type,
          ...data
        }, window.location.origin);
      }
    };

    if (session?.user) {
      // Authentication successful
      sendMessageToParent('AUTH_SUCCESS', { user: session.user });
    } else {
      // Check URL for error parameters
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      
      if (error) {
        sendMessageToParent('AUTH_ERROR', { error });
      } else {
        // Still loading or no session yet, wait a bit more
        const timer = setTimeout(() => {
          if (!session) {
            sendMessageToParent('AUTH_ERROR', { error: 'Authentication failed or cancelled' });
          }
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, [session, status]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          {status === 'loading' ? 'Completing sign in...' : 'Authentication in progress'}
        </h2>
        <p className="text-gray-600">
          Please wait while we finish setting up your account.
        </p>
      </div>
    </div>
  );
}