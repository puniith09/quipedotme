'use client';

import { signIn, useSession } from 'next-auth/react';
import { useParams, usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { prepareChatTransfer } from './chat-transfer-handler';

export function GoogleSignInButton() {
  const pathname = usePathname();
  const params = useParams();
  const { data: session } = useSession();

  const handleGoogleSignIn = async () => {
    // Prepare chat transfer if user is currently on a chat page as a guest
    prepareChatTransfer(session);
    
    if (pathname.startsWith('/chat/')) {
      const chatId = pathname.split('/').pop() || '';
      
      // Store auth intent and chat ID for backup
      sessionStorage.setItem('authIntent', 'existing_chat');
      sessionStorage.setItem('chatId', chatId);
      
      // Return to home after OAuth, the ChatTransferHandler will redirect to the chat if transfer is successful
      signIn('google', { callbackUrl: '/' });
    } else {
      // For root page, redirect to root after OAuth
      sessionStorage.setItem('authIntent', 'oauth_return');
      signIn('google', { callbackUrl: '/' });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleSignIn}
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
      Continue with Google
    </Button>
  );
}