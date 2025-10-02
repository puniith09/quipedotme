import { tool } from 'ai';
import { z } from 'zod';
import { Supermemory } from 'supermemory';
import type { Session } from 'next-auth';

/**
 * Get Supermemory tools with user context for AI SDK integration
 * These tools provide automatic memory management for chat conversations
 */
export function getSupermemoryTools(session: Session) {
  // Use user ID as both orgId and userId for data isolation
  const userId = session.user?.id;
  
  if (!userId) {
    throw new Error('User ID is required for Supermemory tools');
  }

  const apiKey = process.env.SUPERMEMORY_API_KEY;
  
  if (!apiKey) {
    console.warn('SUPERMEMORY_API_KEY not found - Supermemory tools will be disabled');
    return null;
  }

  let supermemoryClient: Supermemory;
  
  try {
    supermemoryClient = new Supermemory({
      apiKey: apiKey,
    });
  } catch (error) {
    console.error('Failed to initialize Supermemory client:', error);
    return null;
  }

  const containerTags = [`user:${userId}`, 'quipe-chat'];

  return {
    addMemory: tool({
      description: `Save important information to my long-term memory. Use this to remember user preferences, important facts, personal details, or context from our conversation that might be useful later.`,
      inputSchema: z.object({
        content: z.string().describe('The information to save to memory'),
        title: z.string().optional().describe('A brief title or summary of the memory'),
      }),
      execute: async ({ content, title }) => {
        try {
          const response = await supermemoryClient.documents.add({
            content,
            containerTags,
            metadata: {
              type: 'chat_memory',
              userId,
              timestamp: new Date().toISOString(),
              title: title || 'Memory from chat conversation',
            },
          });
          
          return {
            success: true,
            message: `Memory saved successfully`,
            documentId: response.id,
          };
        } catch (error) {
          console.error('Error adding memory:', error);
          return {
            success: false,
            message: `Failed to save memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    }),

    searchMemories: tool({
      description: `Search through my memories to find relevant information from past conversations. Use this to provide context-aware responses based on what I know about the user.`,
      inputSchema: z.object({
        query: z.string().describe('What to search for in my memories'),
        limit: z.number().optional().default(5).describe('Maximum number of memories to retrieve'),
      }),
      execute: async ({ query, limit = 5 }) => {
        try {
          const results = await supermemoryClient.search.documents({
            q: query,
            limit,
            containerTags,
          });
          
          if (!results.results || results.results.length === 0) {
            return {
              success: true,
              memories: [],
              message: 'No relevant memories found for this query.',
            };
          }

          const memories = results.results.map((result) => ({
            id: result.documentId,
            title: result.title,
            content: result.chunks?.[0]?.content || result.content,
            relevanceScore: result.chunks?.[0]?.score || result.score,
            createdAt: result.createdAt,
          }));

          return {
            success: true,
            memories,
            message: `Found ${memories.length} relevant memories.`,
          };
        } catch (error) {
          console.error('Error searching memories:', error);
          return {
            success: false,
            memories: [],
            message: `Failed to search memories: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    }),
  };
}