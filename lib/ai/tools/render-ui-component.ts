import { z } from 'zod';
import { tool } from 'ai';
import type { UIMessageStreamWriter } from 'ai';
import type { ChatMessage } from '@/lib/types';

interface RenderUIComponentProps {
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const renderUIComponent = ({
  dataStream,
}: RenderUIComponentProps) =>
  tool({
    description: 'Specify UI components to render in chat (Google sign-in button, forms, etc.)',
    inputSchema: z.object({
      componentType: z.enum(['google-signin-button', 'username-input', 'profile-form', 'success-card'])
        .describe('The type of component to render'),
      props: z.object({}).optional()
        .describe('Props to pass to the component'),
      message: z.string()
        .describe('Message to show with the component'),
    }),
    execute: async ({ componentType, props, message }) => {
      // Create a UI component specification
      const componentSpec = {
        type: componentType,
        props: props || {},
        message,
      };

      // Stream this as a special UI component message
      dataStream.write({
        type: 'data-uiComponent',
        data: componentSpec,
      });

      return {
        success: true,
        rendered: componentType,
      };
    },
  });