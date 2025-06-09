import { zValidator } from '@hono/zod-validator';
import { id } from '@instantdb/core';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
// import { streamSSE } from 'hono/streaming';
import { z } from 'zod/v4';
import { betterAuthMiddleware } from './middleware/better-auth-middleware';
import { dbMiddleware } from './middleware/db-middleware';
import { envMiddleware } from './middleware/env-middleware';
import { AppBindings } from './types';
import { HttpError } from './utils/http-error';

type Messages = Parameters<typeof streamText>[0]['messages'];
export const getLasagnaRecipe = async ({
  messages,
  config,
  db,
}: {
  messages: Messages;
  config: {
    model: string;
    userId: string;
    chatId: string;
  };
  db: AppBindings['Variables']['db'];
}) => {
  const openrouter = createOpenRouter({
    apiKey:
      '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',
  });
  console.log('messages:', messages);
  console.log('config:', config);
  const { textStream } = streamText({
    model: openrouter(config.model),
    messages,
  });
  let messageId: string | null = null;
  let sqId = 0;
  for await (const text of textStream) {
    if (!messageId) {
      messageId = id();
      await db
        .transact(
          db.tx.messages[messageId]
            .update({
              role: 'assistant',
              chatId: config.chatId,
              content: {
                [sqId]: text,
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .link({ chat: config.chatId }),
        )
        .catch(err => console.log('err:', err));
    } else {
      await db
        .transact(
          db.tx.messages[messageId].merge({
            content: {
              [sqId]: text,
            },
          }),
        )
        .catch(err => console.log('err 2:', err));
    }
    sqId++;
  }
};

const bodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    }),
  ),
  config: z.object({
    model: z.string(),
    userId: z.string(),
    chatId: z.string(),
  }),
});
const app = new Hono<AppBindings>({ strict: false })
  .use(cors())
  .use(envMiddleware)
  .use(dbMiddleware)
  .use(betterAuthMiddleware)
  // .use(superjsonMiddleware)
  .post('/api/model', zValidator('json', bodySchema), async c => {
    const body = c.req.valid('json');
    c.executionCtx.waitUntil(
      getLasagnaRecipe({
        ...body,
        db: c.get('db'),
      }),
    );
    return c.json({ success: true });
    // return streamSSE(c, async stream => {
    //   stream.onAbort(() => console.log('aborted'));
    //   for await (const text of textStream) {
    //     await stream.writeSSE({
    //       data: text,
    //       event: 'message',
    //       id: String(id++),
    //     });
    //   }
    // });
  })
  .on(['POST', 'GET'], '/api/auth/*', c => {
    const auth = c.get('auth');
    return auth.handler(c.req.raw);
  })
  .onError((err, c) => {
    if (err instanceof HttpError) {
      return c.json({ error: err.message }, err.status);
    }
    return c.json({ error: err.message }, 500);
  });

export default app;
export type ApiRoutes = typeof app;
