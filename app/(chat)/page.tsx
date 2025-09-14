import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { guestRegex } from '@/lib/constants';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { getChatsByUserId } from '@/lib/db/queries';
import { auth } from '../(auth)/auth';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const params = await searchParams;

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  // Check if user is guest (needs onboarding) or if they're coming from Google sign-in
  const isGuest = session?.user?.email ? guestRegex.test(session.user.email) : false;
  const isOnboarding = params.onboarding === 'true';
  const chatId = params.chatId as string;
  
  // If returning from Google sign-in with chatId, redirect to that specific chat
  if (isOnboarding && chatId) {
    redirect(`/chat/${chatId}?onboarding=true`);
  }

  // For existing users (not guests), check if they have previous chats
  let redirectToExistingChat = false;
  if (!isGuest && session?.user?.id && !chatId && !isOnboarding) {
    try {
      const userChats = await getChatsByUserId({
        id: session.user.id,
        limit: 1,
        startingAfter: null,
        endingBefore: null,
      });
      
      // If user has existing chats, redirect to the most recent one
      if (userChats.chats && userChats.chats.length > 0) {
        const mostRecentChat = userChats.chats[0];
        redirect(`/chat/${mostRecentChat.id}`);
      }
    } catch (error) {
      console.error('Error fetching user chats:', error);
      // Continue with new chat creation if there's an error
    }
  }
  
  // Use chat ID from URL if available (to continue existing conversation)
  // Or generate new one for fresh conversations
  const id = chatId || generateUUID();
  
  // Initial messages - only show for new conversations (when no chatId is provided)
  let initialMessages: any[] = [];
  
  if (!chatId) {
    if (isGuest) {
      // Guest user - show signup flow
      initialMessages = [
        {
          id: generateUUID(),
          role: 'assistant' as const,
          parts: [
            {
              type: 'text' as const,
              text: "👋 Hey there! Welcome to our AI-powered link bio tool! We're excited to help you create an amazing profile. Let's get started!\n\nTo begin, would you like to connect your Google account?\n\n**Quick responses:**"
            }
          ],
          metadata: {
            createdAt: new Date().toISOString(),
          },
        }
      ];
    } else if (isOnboarding) {
      // Returning from Google sign-in
      initialMessages = [
        {
          id: generateUUID(),
          role: 'assistant' as const,
          parts: [
            {
              type: 'text' as const,
              text: `🎉 Awesome! Welcome ${session?.user?.name || 'to the team'}! You're all signed in.\n\nNow let's create your amazing link bio! I'll help you set up:\n\n✨ Your unique username\n📸 Profile photos (up to 3)\n🔗 Social media links (up to 6)\n💫 And more!\n\nShall we start by choosing your username?`
            }
          ],
          metadata: {
            createdAt: new Date().toISOString(),
          },
        }
      ];
    } else if (session?.user && !isGuest) {
      // Existing user starting new conversation
      initialMessages = [
        {
          id: generateUUID(),
          role: 'assistant' as const,
          parts: [
            {
              type: 'text' as const,
              text: `👋 Welcome back, ${session.user.name || 'there'}! 

I'm your AI assistant, ready to help you with anything you need. How can I assist you today?`
            }
          ],
          metadata: {
            createdAt: new Date().toISOString(),
          },
        }
      ];
    }
  }
  
  const shouldShowOnboarding = isGuest || isOnboarding;

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={initialMessages}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session!}
          autoResume={false}
          isOnboarding={shouldShowOnboarding}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={initialMessages}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session!}
        autoResume={false}
        isOnboarding={shouldShowOnboarding}
      />
      <DataStreamHandler />
    </>
  );
}
