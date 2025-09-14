import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { getUserByUsername } from '@/lib/db/queries';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { guestRegex } from '@/lib/constants';
import { DataStreamHandler } from '@/components/data-stream-handler';

interface UsernamePageProps {
  params: Promise<{
    username: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UsernamePage({ params, searchParams }: UsernamePageProps) {
  const { username } = await params;
  const urlParams = await searchParams;
  
  const session = await auth();
  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');
  
  // Check if current user is guest or signed in
  const isGuest = session?.user?.email ? guestRegex.test(session.user.email) : false;
  const isOnboarding = urlParams.onboarding === 'true';
  
  // Check if this username exists
  let targetUser = null;
  let isUsernameAvailable = false;
  
  try {
    const [foundUser] = await getUserByUsername(username);
    targetUser = foundUser;
  } catch (error) {
    // Username doesn't exist - this could be a signup opportunity
    isUsernameAvailable = true;
  }
  
  if (!targetUser && !isUsernameAvailable) {
    notFound();
  }
  
  const isTargetUserSelf = session?.user?.id === targetUser?.id;
  
  // Generate consistent chat ID based on the interaction
  const chatId = isGuest 
    ? `guest-claim-${username}` 
    : session?.user?.id 
      ? isUsernameAvailable 
        ? `claim-${username}-${session.user.id}`
        : `user-${session.user.id}-to-${targetUser.id}`
      : generateUUID();
  
  // Initial messages based on context
  let initialMessages: any[] = [];
  
  if (isUsernameAvailable) {
    // Username is available - this is a claim/signup scenario
    if (isGuest) {
      initialMessages = [
        {
          id: generateUUID(),
          role: 'assistant' as const,
          parts: [
            {
              type: 'text' as const,
              text: `🎉 Great news! The username "${username}" is available!\n\nWould you like to claim quipe.me/${username} as your profile? I can help you set it up!\n\nTo get started, let's connect your Google account:\n\n**Quick responses:**`
            }
          ],
          metadata: {
            createdAt: new Date().toISOString(),
          },
        }
      ];
    } else if (isOnboarding) {
      initialMessages = [
        {
          id: generateUUID(),
          role: 'assistant' as const,
          parts: [
            {
              type: 'text' as const,
              text: `🎉 Perfect! Welcome to your new profile at quipe.me/${username}!\n\nLet's set it up together. I'll help you:\n\n✨ Add a bio and description\n📸 Upload photos\n🔗 Add social media links\n💫 Make it uniquely yours!\n\nWhat would you like to work on first?`
            }
          ],
          metadata: {
            createdAt: new Date().toISOString(),
          },
        }
      ];
    } else {
      // Signed-in user viewing available username
      initialMessages = [
        {
          id: generateUUID(),
          role: 'assistant' as const,
          parts: [
            {
              type: 'text' as const,
              text: `The username "${username}" is available! Would you like to claim quipe.me/${username} as your profile?`
            }
          ],
          metadata: {
            createdAt: new Date().toISOString(),
          },
        }
      ];
    }
  } else if (isTargetUserSelf && isOnboarding) {
    // User just signed in and is setting up their existing profile
    initialMessages = [
      {
        id: generateUUID(),
        role: 'assistant' as const,
        parts: [
          {
            type: 'text' as const,
            text: `🎉 Welcome back to your profile at quipe.me/${username}!\n\nLet's continue customizing it. I can help you:\n\n✨ Update your bio\n📸 Add more photos\n🔗 Add social media links\n💫 Make it even better!\n\nWhat would you like to work on?`
          }
        ],
        metadata: {
          createdAt: new Date().toISOString(),
        },
      }
    ];
  } else if (!isTargetUserSelf && targetUser) {
    // Someone visiting another user's profile
    initialMessages = [
      {
        id: generateUUID(),
        role: 'assistant' as const,
        parts: [
          {
            type: 'text' as const,
            text: `👋 Hi! You're viewing ${targetUser.displayName || targetUser.username}'s profile. Feel free to ask me anything about them or send a message!`
          }
        ],
        metadata: {
          createdAt: new Date().toISOString(),
        },
      }
    ];
  }
  
  const shouldShowOnboarding = (isUsernameAvailable && (isGuest || isOnboarding)) || (isTargetUserSelf && isOnboarding);
  
  const chatModel = modelIdFromCookie?.value || DEFAULT_CHAT_MODEL;
  
  return (
    <>
      <div className="min-h-screen bg-background">
        <Chat
          id={chatId}
          initialMessages={initialMessages}
          initialChatModel={chatModel}
          initialVisibilityType="private"
          isReadonly={false}
          session={session!}
          autoResume={false}
          isOnboarding={shouldShowOnboarding}
          targetUsername={username}
          isTargetUserSelf={isTargetUserSelf}
          isUsernameAvailable={isUsernameAvailable}
        />
      </div>
      <DataStreamHandler />
    </>
  );
}

export async function generateMetadata({ params }: UsernamePageProps) {
  const { username } = await params;
  
  try {
    const [user] = await getUserByUsername(username);
    
    if (!user) {
      return {
        title: 'Profile Not Found',
      };
    }
    
    const displayName = user.displayName || user.username;
    
    return {
      title: `${displayName} (@${user.username}) | Quipe`,
      description: user.bio || `Connect with ${displayName} on Quipe`,
    };
  } catch (error) {
    return {
      title: 'Profile Not Found | Quipe',
    };
  }
}