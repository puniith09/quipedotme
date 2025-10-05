import { z } from 'zod';
import { tool } from 'ai';

export const profileSetup = tool({
  description: 'Help user set up their profile after successful authentication. Use this to guide them through profile creation and customization.',
  inputSchema: z.object({
    message: z.string().describe('A welcoming message for the user after successful authentication'),
    step: z.enum(['welcome', 'basic_info', 'preferences', 'complete']).describe('Current step in the profile setup process'),
  }),
  execute: async ({ message, step }) => {
    return {
      type: 'profile-setup',
      message,
      step,
    };
  },
});