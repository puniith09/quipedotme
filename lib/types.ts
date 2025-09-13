import { z } from 'zod';
import type { getWeather } from './ai/tools/get-weather';
import type { createDocument } from './ai/tools/create-document';
import type { updateDocument } from './ai/tools/update-document';
import type { requestSuggestions } from './ai/tools/request-suggestions';
import type { InferUITool, LanguageModelUsage, UIMessage } from 'ai';

import type { ArtifactKind } from '@/components/artifact';
import type { Suggestion, User, UserPhoto, SocialLink } from './db/schema';

export type DataPart = { type: 'append-message'; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export type UserWithProfile = User & {
  photos: UserPhoto[];
  socialLinks: SocialLink[];
};

export const registerFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be at most 32 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z.string().max(100, 'Display name must be at most 100 characters').optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  profilePicture: z.string().optional(),
  photos: z.array(z.object({
    url: z.string().url('Please enter a valid URL'),
    order: z.string(),
  })).max(3, 'You can upload up to 3 photos').optional(),
  socialLinks: z.array(z.object({
    platform: z.string().min(1, 'Platform is required'),
    url: z.string().url('Please enter a valid URL'),
    displayText: z.string().max(100, 'Display text must be at most 100 characters').optional(),
    order: z.string(),
  })).max(6, 'You can add up to 6 social links').optional(),
});

type weatherTool = InferUITool<typeof getWeather>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  usage: LanguageModelUsage;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}
