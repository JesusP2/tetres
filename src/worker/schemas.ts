import { z } from 'zod/v4';
import { models } from './utils/models';

export const textPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});
export const filePartSchema = z.object({
  type: z.literal('file'),
  data: z.url(),
  filename: z.string(),
  mimeType: z.string(),
});
export const imagePartSchema = z.object({
  type: z.literal('image'),
  image: z.url(),
  mimeType: z.string(),
});
export const redactedReasoningPartSchema = z.object({
  type: z.literal('redacted-reasoning'),
  data: z.string(),
});
export const reasoningPartSchema = z.object({
  type: z.literal('reasoning'),
  text: z.string(),
});
export const toolCallPartSchema = z.object({
  type: z.literal('tool-call'),
  toolCallId: z.string(),
  toolName: z.string(),
  args: z.unknown(),
});

export const coreSystemMessageSchema = z.object({
  role: z.literal('system'),
  content: z.string(),
});

export const userContentSchema = z.array(
  z.discriminatedUnion('type', [
    textPartSchema,
    filePartSchema,
    imagePartSchema,
  ]),
);
export const coreUserMessageSchema = z.object({
  role: z.literal('user'),
  content: userContentSchema,
});

export const assistantContentSchema = z.array(
  z.discriminatedUnion('type', [
    textPartSchema,
    filePartSchema,
    reasoningPartSchema,
    redactedReasoningPartSchema,
    toolCallPartSchema,
  ]),
);
export const coreAssistantMessageSchema = z.object({
  role: z.literal('assistant'),
  content: assistantContentSchema,
});

export const toolResultPartSchema = z.object({
  type: z.literal('tool-result'),
  toolCallId: z.string(),
  toolName: z.string(),
  args: z.unknown(),
  result: z.unknown(),
});
export const toolContentSchema = z.array(toolResultPartSchema);
export const toolMessageSchema = z.object({
  role: z.literal('tool'),
  content: toolContentSchema,
});

export const messageSchema = z.discriminatedUnion('role', [
  coreSystemMessageSchema,
  coreUserMessageSchema,
  coreAssistantMessageSchema,
  toolMessageSchema,
]);
export const bodySchema = z.object({
  messages: z.array(messageSchema),
  config: z.object({
    model: z.enum(models.map(m => m.id)),
    userId: z.string(),
    chatId: z.string(),
    messageId: z.string(),
    web: z.boolean().optional().default(false),
    reasoning: z
      .enum(['off', 'low', 'medium', 'high'])
      .optional()
      .default('off'),
  }),
});

export const renameChatSchema = z.object({
  chatId: z.string(),
  message: z.string(),
});
