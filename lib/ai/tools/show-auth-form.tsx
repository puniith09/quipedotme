import { z } from 'zod';
import { tool } from 'ai';

export const showAuthForm = tool({
  description: 'Show authentication form (login/signup) to the user when they want to create an account. Use this ONLY when user agrees to login/signup. DO NOT assume they are already logged in - they still need to complete the authentication process.',
  inputSchema: z.object({
    message: z.string().describe('A message to show above the auth form. Use messages like "Please sign in to continue" or "Create your account to get started". NEVER say they are already logged in.'),
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