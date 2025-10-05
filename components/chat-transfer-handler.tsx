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

      // Check if there's a chat transfer pending
      const pendingTransfer = sessionStorage.getItem('pending-chat-transfer');
      
      if (pendingTransfer) {
        try {
          const { chatId, guestUserId } = JSON.parse(pendingTransfer);
          
          // Clear the pending transfer first
          sessionStorage.removeItem('pending-chat-transfer');
          
          // Attempt to transfer the chat
          const response = await fetch('/api/transfer-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId, guestUserId }),
          });

          if (response.ok) {
            // Successfully transferred, redirect to the chat
            router.push(`/chat/${chatId}`);
          } else {
            // Transfer failed, redirect to home to start fresh
            router.push('/');
          }
        } catch (error) {
          console.error('Error during chat transfer:', error);
          // On error, redirect to home
          router.push('/');
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