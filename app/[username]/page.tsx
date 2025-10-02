import { notFound } from 'next/navigation';
import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { getUserByUsername } from '@/lib/db/queries';

interface PublicProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  
  // Get the profile owner by username
  const profileOwner = await getUserByUsername(username);
  
  if (!profileOwner) {
    notFound();
  }

  const chatId = generateUUID();

  return (
    <>
      <DataStreamHandler />
      <Chat
        key={chatId}
        id={chatId}
        initialMessages={[]}
        initialChatModel={DEFAULT_CHAT_MODEL}
        initialVisibilityType="public"
        isReadonly={false}
        session={null}
        autoResume={false}
        profileOwner={profileOwner}
        isPublicProfile={true}
      />
    </>
  );
}

export async function generateMetadata({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  const profileOwner = await getUserByUsername(username);
  
  if (!profileOwner) {
    return {
      title: 'Profile Not Found',
    };
  }

  return {
    title: `Chat with ${username} | Quipe`,
    description: `Have a conversation with ${username}'s AI representative. Ask about their work, interests, and experience.`,
  };
}