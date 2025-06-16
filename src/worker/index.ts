import { zValidator } from '@hono/zod-validator';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, streamText } from 'ai';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createRouteHandler, UTApi } from 'uploadthing/server';
import { z } from 'zod/v4';
import { betterAuthMiddleware } from './middleware/better-auth-middleware';
import { dbMiddleware } from './middleware/db-middleware';
import { envMiddleware } from './middleware/env-middleware';
import { bodySchema, renameChatSchema } from './schemas';
import { AppBindings } from './types';
import { uploadRouter } from './uploadrouter';
import { HttpError } from './utils/http-error';
import { models } from './utils/models';

type Body = z.infer<typeof bodySchema>;

export const renameChat = async ({
  message,
  apiKey,
}: {
  message: string;
  apiKey: string;
}) => {
  const openrouter = createOpenRouter({
    apiKey,
  });

  const response = await generateText({
    model: openrouter('google/gemma-2-9b-it'),
    prompt: `Using this message as context, I need you to generate a title for a chat. The title should be a short. The title should not be longer than 10 words. Please generate the title only, without any additional explanation or context. Do not include any other text or information in your response. The title should be in the format of a sentence, starting with a capital letter, should only include letters in the alphabet and spaces, do not add special characters. Use the same language the message was written in. Here is the message: ${message}`,
  });
  const text = response.text;
  return text;
};

export const sendMessageToModel = async ({
  messages,
  config,
  db,
  apiKey,
}: {
  messages: Body['messages'];
  config: Body['config'];
  db: AppBindings['Variables']['db'];
  apiKey: string;
}) => {
  const openrouter = createOpenRouter({
    apiKey,
  });
  let model: string = config.model;
  if (config.web) {
    model = `${config.model}:online`;
  }
  const settings: {
    reasoning?: {
      effort: 'low' | 'medium' | 'high';
    };
  } = {};
  if (config.reasoning !== 'off') {
    settings.reasoning = {
      effort: config.reasoning,
    };
  }

  const messageId = config.messageId;
  let sqId = 0;
  let compoundedTime = 0;
  let last = new Date().getTime();
  const response = streamText({
    model: openrouter(model, settings),
    messages,
    onChunk: async ({ chunk }) => {
      compoundedTime += new Date().getTime() - last;
      const message = await db.query({
        messages: {
          $: {
            where: {
              id: messageId,
            },
          },
        },
      });
      if (message.messages[0].aborted) {
        await db.transact(
          db.tx.messages[messageId].update({
            finished: new Date().toISOString(),
          }),
        );
        throw new Error('aborted');
      }
      if (chunk.type === 'reasoning') {
        const text = chunk.textDelta;
        await db
          .transact(
            db.tx.messages[messageId].merge({
              reasoning: {
                [sqId]: text,
              },
            }),
          )
          .catch(console.error);
      } else if (chunk.type === 'text-delta') {
        const text = chunk.textDelta;
        await db
          .transact(
            db.tx.messages[messageId].merge({
              content: {
                [sqId]: text,
              },
            }),
          )
          .catch(console.error);
      }
      sqId++;
      last = new Date().getTime();
    },
  });
  await response.consumeStream()
  // for await (const _ of response.consumeStream {
  //   continue;
  // }
  const usage = await response.usage;
  const update = {
    finished: new Date().toISOString(),
    time: compoundedTime,
    tokens: usage.completionTokens,
  };
  await db.transact(db.tx.messages[messageId].update(update));
};

const app = new Hono<AppBindings>({ strict: false })
  .use(cors())
  .use(envMiddleware)
  .use(dbMiddleware)
  .use(betterAuthMiddleware)
  .on(['POST', 'GET'], '/api/uploadthing', async c => {
    const handlers = createRouteHandler({
      router: uploadRouter,
      config: {
        token: c.env.UPLOADTHING_TOKEN,
        isDev: c.env.ENVIRONMENT === 'production',
        fetch: (url, init) => {
          if (init && 'cache' in init) delete init.cache;
          return fetch(url, init);
        },
        handleDaemonPromise: promise => c.executionCtx.waitUntil(promise),
      },
    });
    return handlers(c.req.raw);
  })
  .delete('/api/storage/:fileKey', async c => {
    const fileKey = c.req.param('fileKey');
    const utapi = new UTApi({
      token: c.env.UPLOADTHING_TOKEN,
    });
    await utapi.deleteFiles(fileKey);
    return c.json({ success: true });
  })
  .post('/api/rename-chat', zValidator('json', renameChatSchema), async c => {
    const body = c.req.valid('json');
    const newTitle = await renameChat({
      message: body.message,
      apiKey: c.env.OPENROUTER_KEY,
    });
    const db = c.get('db');
    await db.transact(
      db.tx.chats[body.chatId].update({
        title: newTitle,
        updatedAt: new Date().toISOString(),
      }),
    );
    return c.json({ success: true });
  })
  .post('/api/model', zValidator('json', bodySchema), async c => {
    const body = c.req.valid('json');
    const modelId = body.config.model;
    const model = models.find(m => m.id === modelId);

    if (model && !model.architecture.input_modalities.includes('file')) {
      const filteredMessages = [];
      for (const message of body.messages) {
        let keep = true;
        if (message.role === 'user' || message.role === 'assistant') {
          if (Array.isArray(message.content)) {
            for (const part of message.content) {
              if (part.type === 'file') {
                keep = false;
                break;
              }
            }
          }
        }
        if (keep) {
          filteredMessages.push(message);
        }
      }
      body.messages = filteredMessages;
    }
    c.executionCtx.waitUntil(
      sendMessageToModel({
        ...body,
        db: c.get('db'),
        apiKey: c.env.OPENROUTER_KEY,
      }),
    );
    return c.json({ success: true });
  })
  .on(['POST', 'GET'], '/api/auth/*', async c => {
    const auth = c.get('auth');
    const yo = await auth.handler(c.req.raw).catch(console.error);
    return yo;
  })
  .onError((err, c) => {
    console.error(err);
    if (err instanceof HttpError) {
      return c.json({ error: err.message }, err.status);
    }
    return c.json({ error: err.message }, 500);
  });

export default app;
export type ApiRoutes = typeof app;
