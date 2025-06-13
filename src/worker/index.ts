import { zValidator } from '@hono/zod-validator';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createRouteHandler, UTApi } from 'uploadthing/server';
import { z } from 'zod/v4';
import { betterAuthMiddleware } from './middleware/better-auth-middleware';
import { dbMiddleware } from './middleware/db-middleware';
import { envMiddleware } from './middleware/env-middleware';
import { bodySchema } from './schemas';
import { AppBindings } from './types';
import { uploadRouter } from './uploadrouter';
import { HttpError } from './utils/http-error';

type Body = z.infer<typeof bodySchema>;
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
  const { textStream } = streamText({
    model: openrouter(config.model),
    messages,
  });
  const messageId = config.messageId;
  let sqId = 0;
  for await (const text of textStream) {
    const message = await db.query({
      messages: {
        $: {
          where: {
            id: messageId,
          },
        },
      },
    });
    if (message.messages[0].aborted) break;
    await db
      .transact(
        db.tx.messages[messageId].merge({
          content: {
            [sqId]: text,
          },
        }),
      )
      .catch(console.error);
    sqId++;
  }
  await db.transact(
    db.tx.messages[messageId].update({
      finished: new Date().toISOString(),
    }),
  );
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
  .post('/api/model', zValidator('json', bodySchema), async c => {
    const body = c.req.valid('json');
    c.executionCtx.waitUntil(
      sendMessageToModel({
        ...body,
        db: c.get('db'),
        apiKey: c.env.OPENROUTER_KEY,
      }),
    );
    return c.json({ success: true });
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
