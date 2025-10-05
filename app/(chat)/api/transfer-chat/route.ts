import { auth } from '@/app/(auth)/auth';
import { getChatById, transferGuestChatsToUser } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { NextRequest } from 'next/server';

/**
 * Merge guest messages into user's permanent chat
 * This API handles the seamless transition of messages when users
 * log in after starting a conversation as a guest
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth();
    
    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    // Extract merge parameters
    const { guestUserId, newUserId } = await request.json();

    // Validate required parameters
    if (!guestUserId || !newUserId) {
      return new ChatSDKError(
        'bad_request:api',
        'guestUserId and newUserId are required'
      ).toResponse();
    }

    // Ensure the authenticated user is the target user
    if (session.user.id !== newUserId) {
      return new ChatSDKError('forbidden:chat').toResponse();
    }

    // Merge guest messages into user's permanent chat
    // This preserves the user's conversation history across the login transition
    const permanentChatId = await transferGuestChatsToUser({
      guestUserId,
      newUserId: session.user.id,
    });

    return Response.json({ 
      success: true, 
      permanentChatId,
      message: 'Messages successfully merged into your permanent chat' 
    });
  } catch (error) {
    console.error('Error transferring chat:', error);
    return new ChatSDKError('bad_request:api', 'Failed to transfer chat').toResponse();
  }
}