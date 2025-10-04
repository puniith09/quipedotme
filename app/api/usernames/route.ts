import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';
import { getUsernameChats } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  let session;
  try {
    session = await auth();
  } catch (error) {
    console.error('Authentication error in usernames API:', error);
    return new ChatSDKError(
      'unauthorized:history',
      'Authentication service unavailable'
    ).toResponse();
  }

  if (!session?.user) {
    return new ChatSDKError('unauthorized:history').toResponse();
  }

  try {
    const usernames = await getUsernameChats({
      userId: session.user.id,
    });

    return Response.json({ usernames });
  } catch (error) {
    console.error('Database error in usernames API:', error);
    
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    
    return new ChatSDKError(
      'bad_request:history',
      'Failed to retrieve username chats'
    ).toResponse();
  }
}