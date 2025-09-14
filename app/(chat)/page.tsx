import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { guestRegex } from '@/lib/constants';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { auth } from '../(auth)/auth';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const id = generateUUID();
  const params = await searchParams;

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  // Check if user is guest (needs onboarding) or if they're coming from Google sign-in
  const isGuest = session?.user?.email ? guestRegex.test(session.user.email) : false;
  const isOnboarding = params.onboarding === 'true';
  
  // Initial messages for onboarding if user is guest or just signed in
  const shouldShowOnboarding = isGuest || isOnboarding;
  
  const initialMessages = shouldShowOnboarding ? [
    {
      id: generateUUID(),
      role: 'assistant' as const,
      parts: [
        {
          type: 'text' as const,
          text: isOnboarding 
            ? `🎉 Awesome! Welcome ${session?.user?.name || 'to the team'}! You're all signed in.\n\nNow let's create your amazing link bio! I'll help you set up:\n\n✨ Your unique username\n📸 Profile photos (up to 3)\n🔗 Social media links (up to 6)\n💫 And more!\n\nShall we start by choosing your username?`
            : "👋 Hey there! Welcome to our AI-powered link bio tool! We're excited to help you create an amazing profile. Let's get started!\n\nTo begin, would you like to connect your Google account?\n\n**Quick responses:**"
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
