import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID, convertToUIMessages } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { auth } from '../(auth)/auth';
import { getOrCreateUserMainChat, getMessagesByChatId } from '@/lib/db/queries';

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');
  
  // For authenticated users, get their persistent main chat
  // For guest users, create a temporary chat
  let chatId: string;
  let initialMessages: any[] = [];

  if (session.user?.type === 'guest' || session.user?.email?.includes('guest-')) {
    // Guest user - create temporary chat
    chatId = generateUUID();
    
    // Create initial AI message asking about login for guest users
    initialMessages.push({
      id: generateUUID(),
      role: 'assistant' as const,
      parts: [{
        type: 'text' as const,
        text: 'Hello! I\'m your AI assistant. I can help you with anything you need. Would you like to create an account to save our conversations and access additional features, or would you prefer to continue as a guest?'
      }],
      createdAt: new Date().toISOString(),
    });
  } else {
    // Authenticated user - get or create persistent main chat
    try {
      const userMainChat = await getOrCreateUserMainChat({
        userId: session.user.id,
        userEmail: session.user.email || 'user@example.com',
      });
      
      if (userMainChat) {
        chatId = userMainChat.id;
        
        // Load existing messages from persistent chat
        const messagesFromDb = await getMessagesByChatId({ id: chatId });
        initialMessages = convertToUIMessages(messagesFromDb);
      } else {
        // Fallback to new chat if persistent chat creation fails
        chatId = generateUUID();
      }
    } catch (error) {
      console.error('Error loading persistent chat:', error);
      // Fallback to new chat
      chatId = generateUUID();
    }
  }

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={chatId}
          id={chatId}
          initialMessages={initialMessages}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        key={chatId}
        id={chatId}
        initialMessages={initialMessages}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler />
    </>
  );
}
