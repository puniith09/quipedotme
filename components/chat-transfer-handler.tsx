'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function ChatTransferHandler() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    async function handleChatTransfer() {
      if (!session?.user || session.user.type === 'guest') {
        return;
      }

      // Check if there's a previous guest ID in the token (from JWT callback)
      const previousGuestId = (session as any)?.previousGuestId;
      
      if (previousGuestId) {
        try {
          // Merge guest messages into user's permanent chat
          const response = await fetch('/api/transfer-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              guestUserId: previousGuestId,
              newUserId: session.user.id 
            }),
          });

          if (response.ok) {
            // Successfully merged, refresh the page to show merged messages
            router.refresh();
            console.log('Successfully merged guest messages');
          } else {
            console.error('Failed to merge guest messages');
          }
        } catch (error) {
          console.error('Error during message merge:', error);
        }
      }
    }

    handleChatTransfer();
  }, [session, router]);

  return null; // This component doesn't render anything
}

// Function to call before login to prepare for chat transfer
export function prepareChatTransfer(currentSession: any) {
  if (typeof window === 'undefined') return;
  
  const currentPath = window.location.pathname;
  const chatId = currentPath.match(/\/chat\/([^\/]+)/)?.[1];
  
  // Only prepare transfer if we're on a chat page and user is a guest
  if (chatId && currentSession?.user?.type === 'guest') {
    sessionStorage.setItem('pending-chat-transfer', JSON.stringify({
      chatId,
      guestUserId: currentSession.user.id,
    }));
  }
}