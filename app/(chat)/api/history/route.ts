import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';
import { getChatsByUserId } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Number.parseInt(searchParams.get('limit') || '10');
  const startingAfter = searchParams.get('starting_after');
  const endingBefore = searchParams.get('ending_before');

  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      'bad_request:api',
      'Only one of starting_after or ending_before can be provided.',
    ).toResponse();
  }

  let session;
  try {
    session = await auth();
  } catch (error) {
    console.error('Authentication error in history API:', error);
    return new ChatSDKError(
      'unauthorized:history',
      'Authentication service unavailable'
    ).toResponse();
  }

  if (!session?.user) {
    return new ChatSDKError('unauthorized:history').toResponse();
  }

  try {
    const chats = await getChatsByUserId({
      id: session.user.id,
      limit,
      startingAfter,
      endingBefore,
    });

    return Response.json(chats);
  } catch (error) {
    console.error('Database error in history API:', error);
    
    // The error will be a ChatSDKError from getChatsByUserId
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    
    // Fallback for unexpected errors
    return new ChatSDKError(
      'bad_request:history',
      'Failed to retrieve chat history'
    ).toResponse();
  }
}
