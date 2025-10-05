import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getUserByUsername } from '@/lib/db/queries';
import { Chat } from '@/components/chat';
import { generateUUID } from '@/lib/utils';
import { auth } from '@/app/(auth)/auth';

export default async function UsernamePage({ 
  params 
}: { 
  params: Promise<{ username: string }> 
}) {
  const { username } = await params;
  
  // Get the profile owner's information
  const profileOwner = await getUserByUsername(username);
  
  if (!profileOwner) {
    notFound();
  }

  // Get the current session (visitor)
  const session = await auth();

  // Generate a unique chat ID for this session
  const chatId = generateUUID();

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<div>Loading...</div>}>
            <Chat
              id={chatId}
              initialMessages={[]}
              initialChatModel="grok-2-vision-1212"
              initialVisibilityType="private"
              isReadonly={false}
              session={session}
              autoResume={false}
              profileOwner={{
                id: profileOwner.id,
                username: profileOwner.username!,
                email: profileOwner.email,
              }}
              isPublicProfile={true}
              targetUsername={username}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
