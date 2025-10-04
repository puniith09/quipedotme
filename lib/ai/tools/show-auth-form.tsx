import { z } from 'zod';
import { tool } from 'ai';

export const showAuthForm = tool({
  description: 'Show authentication form (login/signup) to the user when they want to create an account. Use this when user agrees to login or create an account.',
  inputSchema: z.object({
    message: z.string().describe('A helpful message to show above the auth form, like "Please sign in to continue" or "Create your account to get started"'),
    type: z.enum(['login', 'signup']).default('signup').describe('Whether to show login or signup form by default'),
  }),
  execute: async ({ message, type }) => {
    return {
      type: 'auth-form',
      message,
      defaultMode: type,
    };
  },
});