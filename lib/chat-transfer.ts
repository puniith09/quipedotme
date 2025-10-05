import { transferGuestChatsToUser } from './db/queries';

export async function handleChatTransferOnLogin(newUserId: string): Promise<void> {
  try {
    // Check if there's a guest session chat ID stored in localStorage/sessionStorage
    if (typeof window !== 'undefined') {
      const currentChatId = window.location.pathname.match(/\/chat\/([^\/]+)/)?.[1];
      
      if (currentChatId) {
        // Store the chat ID that user was viewing when they logged in
        sessionStorage.setItem('continue-chat-after-login', currentChatId);
      }
    }
  } catch (error) {
    console.error('Error handling chat transfer:', error);
  }
}

export function getContinueChatId(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('continue-chat-after-login');
  }
  return null;
}

export function clearContinueChatId(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('continue-chat-after-login');
  }
}