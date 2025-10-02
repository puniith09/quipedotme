import { tool } from 'ai';
import { z } from 'zod';
import { Supermemory } from 'supermemory';
import type { Session } from 'next-auth';

/**
 * Get AI tools for profile management (owner mode)
 * These tools allow users to update their profile information that will be used by their AI representative
 */
export function getProfileManagementTools(session: Session) {
  const userId = session.user?.id;
  
  if (!userId) {
    throw new Error('User ID is required for profile management tools');
  }

  const apiKey = process.env.SUPERMEMORY_API_KEY;
  
  if (!apiKey) {
    console.warn('SUPERMEMORY_API_KEY not found - Profile management tools will be disabled');
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

  // Use profile-specific tags for profile information
  const profileContainerTags = [`user:${userId}`, 'quipe-profile'];
  const chatContainerTags = [`user:${userId}`, 'quipe-chat'];

  return {
    updateProfileInfo: tool({
      description: `Update your profile information that your AI representative will use to answer questions about you. This includes your bio, work experience, skills, projects, interests, contact info, or any other information you want visitors to know about you.`,
      inputSchema: z.object({
        content: z.string().describe('The profile information to save'),
        category: z.string().describe('Category of information (e.g., "bio", "experience", "skills", "projects", "contact", etc.)'),
        title: z.string().optional().describe('A brief title for this information'),
      }),
      execute: async ({ content, category, title }) => {
        try {
          const response = await supermemoryClient.documents.add({
            content,
            containerTags: profileContainerTags,
            metadata: {
              type: 'profile_info',
              category,
              userId,
              timestamp: new Date().toISOString(),
              title: title || `Profile: ${category}`,
            },
          });
          
          return {
            success: true,
            message: `Profile information for "${category}" has been updated successfully. Your AI representative will now use this information when visitors ask about you.`,
            documentId: response.id,
          };
        } catch (error) {
          console.error('Error updating profile info:', error);
          return {
            success: false,
            message: `Failed to update profile information: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    }),

    searchMyProfile: tool({
      description: `Search through your current profile information to see what your AI representative knows about you.`,
      inputSchema: z.object({
        query: z.string().describe('What to search for in your profile'),
        limit: z.number().optional().default(10).describe('Maximum number of results to retrieve'),
      }),
      execute: async ({ query, limit = 10 }) => {
        try {
          const results = await supermemoryClient.search.documents({
            q: query,
            limit,
            containerTags: profileContainerTags,
          });
          
          if (!results.results || results.results.length === 0) {
            return {
              success: true,
              profileInfo: [],
              message: 'No profile information found for this query. You can add information by telling me about yourself.',
            };
          }

          const profileInfo = results.results.map((result) => ({
            id: result.documentId,
            title: result.title,
            content: result.chunks?.[0]?.content || result.content,
            category: result.metadata?.category || 'general',
            createdAt: result.createdAt,
          }));

          return {
            success: true,
            profileInfo,
            message: `Found ${profileInfo.length} pieces of profile information.`,
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

    // Keep the regular memory tools for general chat
    addMemory: tool({
      description: `Save important information from our conversation to your general memory (not profile-specific).`,
      inputSchema: z.object({
        content: z.string().describe('The information to save to memory'),
        title: z.string().optional().describe('A brief title or summary of the memory'),
      }),
      execute: async ({ content, title }) => {
        try {
          const response = await supermemoryClient.documents.add({
            content,
            containerTags: chatContainerTags,
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
      description: `Search through your general memories from past conversations.`,
      inputSchema: z.object({
        query: z.string().describe('What to search for in your memories'),
        limit: z.number().optional().default(5).describe('Maximum number of memories to retrieve'),
      }),
      execute: async ({ query, limit = 5 }) => {
        try {
          const results = await supermemoryClient.search.documents({
            q: query,
            limit,
            containerTags: chatContainerTags,
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