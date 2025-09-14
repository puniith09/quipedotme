'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function PopupSuccessPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    const sendMessageToParent = (type: string, data?: any) => {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({
          type,
          ...data
        }, window.location.origin);
      }
    };

    if (session?.user) {
      // Authentication successful
      sendMessageToParent('AUTH_SUCCESS', { user: session.user });
      
      // Show success message briefly before closing
      setTimeout(() => {
        window.close();
      }, 1000);
    } else {
      // Check URL for error parameters
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      
      if (error) {
        sendMessageToParent('AUTH_ERROR', { error });
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        // Still loading or no session yet, wait a bit more
        const timer = setTimeout(() => {
          if (!session) {
            sendMessageToParent('AUTH_ERROR', { error: 'Authentication failed or cancelled' });
            window.close();
          }
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [session, status]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
        {status === 'loading' ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Completing sign in...
            </h2>
            <p className="text-gray-600">
              Please wait while we finish setting up your account.
            </p>
          </>
        ) : session?.user ? (
          <>
            <div className="text-green-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Sign in successful!
            </h2>
            <p className="text-gray-600">
              Welcome, {session.user.name || session.user.email}!
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This window will close automatically...
            </p>
          </>
        ) : (
          <>
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Sign in failed
            </h2>
            <p className="text-gray-600">
              There was a problem with the authentication. Please try again.
            </p>
          </>
        )}
      </div>
    </div>
  );
}