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
import { createStreamId } from '@/lib/db/queries';
import { z } from 'zod';

export const maxDuration = 60;

const requestSchema = z.object({
  messages: z.array(z.any()),
  profileOwnerId: z.string(),
  profileOwnerUsername: z.string(),
  profileOwnerEmail: z.string(),
  selectedChatModel: z.string().default('grok-2-vision-1212'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, profileOwnerId, profileOwnerUsername, profileOwnerEmail, selectedChatModel } = requestSchema.parse(body);

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
          onFinish: ({ usage }) => {
            dataStream.write({ type: 'data-usage', data: usage });
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