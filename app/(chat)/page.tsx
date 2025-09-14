import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { guestRegex } from '@/lib/constants';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { auth } from '../(auth)/auth';

export default async function Page() {
  const session = await auth();
  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  // Check if user is guest (needs onboarding)
  const isGuest = session?.user?.email ? guestRegex.test(session.user.email) : false;
  
  // Initial messages for onboarding if user is guest
  const initialMessages = isGuest ? [
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
  ] : [];

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
      />
      <DataStreamHandler />
    </>
  );
}
