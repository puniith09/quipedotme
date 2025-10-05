import { auth } from '@/app/(auth)/auth';
import { getChatById, getOrCreateUserMainChat, mergeGuestMessagesToUserChat } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { NextRequest } from 'next/server';

/**
 * Transfer chat ownership from guest user to authenticated user
 * This API handles the seamless transition of chat ownership when users
 * log in after starting a conversation as a guest
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth();
    
    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    // Extract chat transfer parameters
    const { chatId, guestUserId } = await request.json();

    // Validate required parameters
    if (!chatId || !guestUserId) {
      return new ChatSDKError(
        'bad_request:api',
        'chatId and guestUserId are required'
      ).toResponse();
    }

    // Verify the chat exists and belongs to the guest user
    const chat = await getChatById({ id: chatId });
    
    if (!chat) {
      return new ChatSDKError('not_found:chat').toResponse();
    }

    // Ensure the chat actually belongs to the guest user
    if (chat.userId !== guestUserId) {
      return new ChatSDKError('forbidden:chat').toResponse();
    }

    // TODO: Add additional validation to ensure guestUserId is actually a guest
    // const guestEmailPattern = /^guest-\d+/;
    
    // Get or create user's main persistent chat
    const userMainChat = await getOrCreateUserMainChat({
      userId: session.user.id,
      userEmail: session.user.email || 'user@example.com',
    });

    if (!userMainChat) {
      return new ChatSDKError('bad_request:api', 'Failed to create user main chat').toResponse();
    }

    // Merge guest messages into user's main chat
    const mergedCount = await mergeGuestMessagesToUserChat({
      guestUserId,
      userMainChatId: userMainChat.id,
    });

    return Response.json({ 
      success: true, 
      chatId: userMainChat.id, 
      mergedMessages: mergedCount 
    });
  } catch (error) {
    console.error('Error transferring chat:', error);
    return new ChatSDKError('bad_request:api', 'Failed to transfer chat').toResponse();
  }
}