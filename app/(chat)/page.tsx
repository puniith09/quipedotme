import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { ConversationalOnboarding } from '@/components/conversational-onboarding';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { guestRegex } from '@/lib/constants';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { auth } from '../(auth)/auth';

export default async function Page() {
  const session = await auth();

  // Show conversational onboarding for non-authenticated users or guest users
  const isGuest = session?.user?.email ? guestRegex.test(session.user.email) : false;
  if (!session || isGuest) {
    return <ConversationalOnboarding />;
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
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
        key={id}
        id={id}
        initialMessages={[]}
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
