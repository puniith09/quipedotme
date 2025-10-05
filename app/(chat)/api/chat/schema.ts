import { z } from 'zod';

const textPartSchema = z.object({
  type: z.enum(['text']),
  text: z.string().min(1, "Text content cannot be empty").max(10000, "Text content too long (max 10000 characters)"),
});

const filePartSchema = z.object({
  type: z.enum(['file']),
  mediaType: z.enum(['image/jpeg', 'image/png']),
  name: z.string().min(1).max(100),
  url: z.string().url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

export const postRequestBodySchema = z.object({
  id: z.string().uuid("Invalid UUID format for id"),
  message: z.object({
    id: z.string().uuid("Invalid UUID format for message.id"),
    role: z.enum(['user'], { errorMap: () => ({ message: "Role must be 'user'" }) }),
    parts: z.array(partSchema).min(1, "Message must have at least one part"),
  }),
  selectedChatModel: z.enum(['chat-model', 'chat-model-reasoning'], {
    errorMap: () => ({ message: "selectedChatModel must be 'chat-model' or 'chat-model-reasoning'" })
  }),
  selectedVisibilityType: z.enum(['public', 'private'], {
    errorMap: () => ({ message: "selectedVisibilityType must be 'public' or 'private'" })
  }),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
