import { zValidator } from '@hono/zod-validator';
import { id } from '@instantdb/core';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import OpenAI from 'openai';
import { createRouteHandler, UTApi } from 'uploadthing/server';
import { createAuth } from './auth';
import { generateImage } from './imagegen';
import { betterAuthMiddleware } from './middleware/better-auth-middleware';
import { dbMiddleware } from './middleware/db-middleware';
import { envMiddleware } from './middleware/env-middleware';
import { renameChat } from './rename-chat';
import { bodySchema, renameChatSchema, userKeySchema } from './schemas';
import { AppBindings, Body } from './types';
import { uploadRouter } from './uploadrouter';
import { encryptKey, generateKeyHash, getApiKey } from './utils/crypto';
import { HttpError } from './utils/http-error';
import { models } from './utils/models';

export const sendMessageToOpenrouter = async ({
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
  await response.consumeStream();
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
  .use(csrf())
  .use(envMiddleware)
  .use(dbMiddleware)
  .on(['POST', 'GET'], '/api/auth/*', async c => {
    const auth = createAuth(c.env);
    return auth.handler(c.req.raw).catch(console.error);
  })
  .use(betterAuthMiddleware)
  .on(['POST', 'GET'], '/api/uploadthing', async c => {
    const handlers = createRouteHandler({
      router: uploadRouter,
      config: {
        token: c.env.UPLOADTHING_TOKEN,
        isDev: false,
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
    const user = c.get('user');
    const db = c.get('db');

    // Get appropriate API key (user's or global)
    const apiKey = await getApiKey(
      user.id,
      'openrouter',
      db,
      c.env.OPENROUTER_KEY,
      c.env.BETTER_AUTH_SECRET,
    );

    const newTitle = await renameChat({
      message: body.message,
      apiKey,
    });

    await db.transact(
      db.tx.chats[body.chatId].update({
        title: newTitle,
        updatedAt: new Date().toISOString(),
      }),
    );
    return c.json({ success: true });
  })
  .post('/api/user-keys', zValidator('json', userKeySchema), async c => {
    const { provider, apiKey } = c.req.valid('json');
    const user = c.get('user');
    const db = c.get('db');
    const keyHash = await generateKeyHash(apiKey);
    const encryptedKey = await encryptKey(apiKey, c.env.BETTER_AUTH_SECRET);

    const existingKeys = await db.query({
      apiKeys: {
        $: { where: { userId: user.id, provider } },
      },
    });

    const now = new Date().toISOString();
    if (existingKeys.apiKeys.length > 0) {
      await db.transact(
        db.tx.apiKeys[existingKeys.apiKeys[0].id].update({
          encryptedKey,
          keyHash,
          lastValidated: now,
          updatedAt: now,
        }),
      );
    } else {
      await db.transact(
        db.tx.apiKeys[id()].update({
          provider,
          encryptedKey,
          keyHash,
          isActive: true,
          lastValidated: now,
          createdAt: now,
          updatedAt: now,
          userId: user.id,
        }),
      );
    }
    return c.json({ success: true });
  })
  .post('/api/audio', async c => {
    const formData = await c.req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return c.json({ error: 'No audio file provided' }, 400);
    }
    if (!audioFile.type.startsWith('audio/')) {
      return c.json({ error: 'Invalid file type. Audio files only.' }, 400);
    }
    const maxSize = 10 * 1024 * 1024; // 4MB
    if (audioFile.size > maxSize) {
      return c.json(
        { error: 'Audio file too large. Maximum size is 10MB.' },
        400,
      );
    }

    const user = c.get('user');
    const db = c.get('db');
    const openaiApiKey = await getApiKey(
      user.id,
      'openai',
      db,
      c.env.OPENAI_API_KEY,
      c.env.BETTER_AUTH_SECRET,
    );
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });
    return c.json({
      success: true,
      message: 'Audio transcribed successfully',
      transcription: transcription.text,
    });
  })
  .post('/api/model', zValidator('json', bodySchema), async c => {
    const body = c.req.valid('json');
    const modelId = body.config.model;
    const model = models.find(m => m.id === modelId);
    const canAttachImage = model?.architecture.input_modalities.includes(
      'image' as any,
    );
    const canAttachFile = model?.architecture.input_modalities.includes(
      'file' as any,
    );

    const filteredMessages: Body['messages'] = [];
    for (const message of body.messages) {
      let keep = true;
      if (Array.isArray(message.content)) {
        for (const part of message.content) {
          if (
            message.role === 'user' &&
            part.type === 'file' &&
            part.mimeType.startsWith('text/plain')
          ) {
            keep = false;
            const res = await fetch(part.data);
            if (!res) continue;
            const text = await res.text();
            filteredMessages.push({
              ...message,
              content: [
                {
                  type: 'text',
                  text: text,
                },
              ],
            });
            break;
          }
          if (!canAttachImage && part.type === 'image') {
            keep = false;
            break;
          } else if (!canAttachFile && part.type === 'file') {
            keep = false;
            break;
          }
        }
      }
      if (keep) {
        filteredMessages.push(message);
      }
    }

    const user = c.get('user');
    const db = c.get('db');
    if (body.config.model === 'openai/gpt-4.1-mini-image') {
      const openaiApiKey = await getApiKey(
        user.id,
        'openai',
        db,
        c.env.OPENAI_API_KEY,
        c.env.BETTER_AUTH_SECRET,
      );
      c.executionCtx.waitUntil(
        generateImage({
          filteredMessages,
          OPENAI_API_KEY: openaiApiKey,
          UPLOADTHING_TOKEN: c.env.UPLOADTHING_TOKEN,
          db,
          previousResponseId: body.config.previousResponseId,
          messageId: body.config.messageId,
          chatId: body.config.chatId,
        }),
      );
    } else {
      const openrouterApiKey = await getApiKey(
        user.id,
        'openrouter',
        db,
        c.env.OPENROUTER_KEY,
        c.env.BETTER_AUTH_SECRET,
      );
      c.executionCtx.waitUntil(
        sendMessageToOpenrouter({
          config: body.config,
          messages: filteredMessages,
          db,
          apiKey: openrouterApiKey,
        }),
      );
    }
    return c.json({ success: true });
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
