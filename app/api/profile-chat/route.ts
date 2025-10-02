import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  streamText,
} from 'ai';
import { profileRepresentativePrompt } from '@/lib/ai/prompts';
import { generateUUID } from '@/lib/utils';
import { getProfileRepresentativeTools } from '@/lib/ai/tools/profile-representative';
import { myProvider } from '@/lib/ai/providers';
import { createStreamId, saveChat, saveMessages, getChatById } from '@/lib/db/queries';
import { generateTitleFromUserMessage } from '@/app/(chat)/actions';
import { auth } from '@/app/(auth)/auth';
import { z } from 'zod';

export const maxDuration = 60;

const requestSchema = z.object({
  chatId: z.string().uuid(),
  messages: z.array(z.any()),
  profileOwnerId: z.string(),
  profileOwnerUsername: z.string(),
  profileOwnerEmail: z.string(),
  selectedChatModel: z.string().default('grok-2-vision-1212'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chatId, messages, profileOwnerId, profileOwnerUsername, profileOwnerEmail, selectedChatModel } = requestSchema.parse(body);

    // Check authentication for visitor
    const session = await auth();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if chat exists, if not create it
    const existingChat = await getChatById({ id: chatId });
    if (!existingChat) {
      const lastMessage = messages[messages.length - 1];
      const title = await generateTitleFromUserMessage({
        message: lastMessage,
      });

      await saveChat({
        id: chatId,
        userId: session.user.id,
        title,
        visibility: 'private',
        chatType: 'username_chat',
        targetUsername: profileOwnerUsername,
      });
    }

    // Save the user message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      await saveMessages({
        messages: [{
          chatId,
          id: lastMessage.id,
          role: 'user',
          parts: lastMessage.parts || [{ type: 'text', text: lastMessage.content }],
          attachments: [],
          createdAt: new Date(),
        }],
      });
    }

    // Get tools for profile representative
    const profileTools = getProfileRepresentativeTools(profileOwnerId);
    
    // Create system prompt for representative mode
    const systemMessage = profileRepresentativePrompt(profileOwnerUsername, profileOwnerEmail);

    const streamId = generateUUID();
    
    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemMessage,
          messages: convertToModelMessages(messages),
          experimental_activeTools: profileTools 
            ? ['searchProfileInfo'] as any
            : [],
          experimental_transform: smoothStream({ chunking: 'word' }),
          tools: profileTools || {},
          onFinish: async ({ usage, text }) => {
            dataStream.write({ type: 'data-usage', data: usage });
            
            // Save the AI response
            await saveMessages({
              messages: [{
                chatId,
                id: generateUUID(),
                role: 'assistant',
                parts: [{ type: 'text', text }],
                attachments: [],
                createdAt: new Date(),
              }],
            });
          },
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: false,
          }),
        );
      },
      generateId: generateUUID,
    });

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Profile chat API error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}