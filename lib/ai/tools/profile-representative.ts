import { tool } from 'ai';
import { z } from 'zod';
import { Supermemory } from 'supermemory';

/**
 * Get AI tools specifically for profile representatives (public chat mode)
 * These tools allow the AI to search for profile information to represent the user
 */
export function getProfileRepresentativeTools(profileOwnerId: string) {
  const apiKey = process.env.SUPERMEMORY_API_KEY;
  
  if (!apiKey) {
    console.warn('SUPERMEMORY_API_KEY not found - Profile representative tools will be disabled');
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

  // Search profile owner's data using profile-specific tags
  const containerTags = [`user:${profileOwnerId}`, 'quipe-profile', 'quipe-chat'];

  return {
    searchProfileInfo: tool({
      description: `Search for information about the profile owner to answer questions about them. Use this to find their background, experience, interests, projects, or any other relevant information.`,
      inputSchema: z.object({
        query: z.string().describe('What specific information to search for about the profile owner'),
        limit: z.number().optional().default(5).describe('Maximum number of results to retrieve'),
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
              profileInfo: [],
              message: 'No relevant information found about this topic.',
            };
          }

          const profileInfo = results.results.map((result) => ({
            id: result.documentId,
            title: result.title,
            content: result.chunks?.[0]?.content || result.content,
            relevanceScore: result.chunks?.[0]?.score || result.score,
            createdAt: result.createdAt,
          }));

          return {
            success: true,
            profileInfo,
            message: `Found ${profileInfo.length} relevant pieces of information.`,
          };
        } catch (error) {
          console.error('Error searching profile info:', error);
          return {
            success: false,
            profileInfo: [],
            message: `Failed to search profile information: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    }),
  };
}