import { z } from 'zod/v4';

const textPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});
const filePartSchema = z.object({
  type: z.literal('file'),
  data: z.url(),
  filename: z.string(),
  mimeType: z.string(),
});
const imagePartSchema = z.object({
  type: z.literal('image'),
  image: z.url(),
  mimeType: z.string(),
});
const redactedReasoningPartSchema = z.object({
  type: z.literal('redacted-reasoning'),
  data: z.string(),
});
const reasoningPartSchema = z.object({
  type: z.literal('reasoning'),
  text: z.string(),
});
const toolCallPartSchema = z.object({
  type: z.literal('tool-call'),
  toolCallId: z.string(),
  toolName: z.string(),
  args: z.unknown(),
});

const coreSystemMessageSchema = z.object({
  role: z.literal('system'),
  content: z.string(),
});

const userContentSchema = z.array(
  z.discriminatedUnion('type', [
    textPartSchema,
    filePartSchema,
    imagePartSchema,
  ]),
);
const coreUserMessageSchema = z.object({
  role: z.literal('user'),
  content: userContentSchema,
});

const assistantContentSchema = z.array(
  z.discriminatedUnion('type', [
    textPartSchema,
    filePartSchema,
    reasoningPartSchema,
    redactedReasoningPartSchema,
    toolCallPartSchema,
  ]),
);
const coreAssistantMessageSchema = z.object({
  role: z.literal('assistant'),
  content: assistantContentSchema,
});

const toolResultPartSchema = z.object({
  type: z.literal('tool-result'),
  toolCallId: z.string(),
  toolName: z.string(),
  args: z.unknown(),
  result: z.unknown(),
});
const toolContentSchema = z.array(toolResultPartSchema);
const toolMessageSchema = z.object({
  role: z.literal('tool'),
  content: toolContentSchema,
});

const messageSchema = z.discriminatedUnion('role', [
  coreSystemMessageSchema,
  coreUserMessageSchema,
  coreAssistantMessageSchema,
  toolMessageSchema,
]);
export const bodySchema = z.object({
  messages: z.array(messageSchema),
  config: z.object({
    model: z.string(),
    userId: z.string(),
    chatId: z.string(),
    messageId: z.string(),
  }),
});
