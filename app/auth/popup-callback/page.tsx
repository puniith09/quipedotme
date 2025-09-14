'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function PopupCallbackPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user) {
      // Authentication successful - send message to parent window
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_SUCCESS',
        session: session
      }, window.location.origin);
    } else {
      // Authentication failed - send error message to parent window
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error: 'Authentication failed'
      }, window.location.origin);
    }

    // Close the popup
    window.close();
  }, [session, status]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}