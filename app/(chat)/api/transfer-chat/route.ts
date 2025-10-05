import { auth } from '@/app/(auth)/auth';
import { getChatById, transferGuestChatsToUser } from '@/lib/db/queries';
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
    
    // Transfer all chats from guest user to authenticated user
    // This preserves the user's conversation history across the login transition
    await transferGuestChatsToUser({
      guestUserId,
      newUserId: session.user.id,
    });

    return Response.json({ success: true, chatId });
  } catch (error) {
    console.error('Error transferring chat:', error);
    return new ChatSDKError('bad_request:api', 'Failed to transfer chat').toResponse();
  }
}