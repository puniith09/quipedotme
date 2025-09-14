import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { claimUsername } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { username } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate username format (alphanumeric, underscore, dash, 3-32 chars)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,32}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-32 characters and contain only letters, numbers, underscores, and dashes' },
        { status: 400 }
      );
    }

    const updatedUser = await claimUsername(session.user.id, username);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
      }
    });

  } catch (error) {
    console.error('Username claiming error:', error);
    
    if (error instanceof ChatSDKError) {
      return NextResponse.json(
        { error: error.cause || error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to claim username' },
      { status: 500 }
    );
  }
}