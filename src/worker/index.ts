// import { zValidator } from '@hono/zod-validator';
// import { createOpenRouter } from '@openrouter/ai-sdk-provider';
// import { streamText } from 'ai';
// import { Hono } from 'hono';
// import { cors } from 'hono/cors';
// import { z } from 'zod/v4';
// import { betterAuthMiddleware } from './middleware/better-auth-middleware';
// import { dbMiddleware } from './middleware/db-middleware';
// import { envMiddleware } from './middleware/env-middleware';
// import { AppBindings } from './types';
// import { HttpError } from './utils/http-error';
//
// const bodySchema = z.object({
//   messages: z.array(
//     z.object({
//       role: z.enum(['user', 'assistant']),
//       content: z.string(),
//     }),
//   ),
//   config: z.object({
//     model: z.string(),
//     userId: z.string(),
//     chatId: z.string(),
//     messageId: z.string(),
//   }),
// });
//
// type Body = z.infer<typeof bodySchema>;
// export const sendMessageToModel = async ({
//   messages,
//   config,
//   db,
//   apiKey,
// }: {
//   messages: Body['messages'];
//   config: Body['config'];
//   db: AppBindings['Variables']['db'];
//   apiKey: string;
// }) => {
//   const openrouter = createOpenRouter({
//     apiKey,
//   });
//   const { textStream } = streamText({
//     model: openrouter(config.model),
//     messages,
//   });
//   const messageId = config.messageId;
//   let sqId = 0;
//   for await (const text of textStream) {
//     const message = await db.query({
//       messages: {
//         $: {
//           where: {
//             id: messageId,
//           },
//         },
//       },
//     });
//     if (message.messages[0].aborted) break;
//     await db
//       .transact(
//         db.tx.messages[messageId].merge({
//           content: {
//             [sqId]: text,
//           },
//         }),
//       )
//       .catch(console.error);
//     sqId++;
//   }
//   await db.transact(
//     db.tx.messages[messageId].update({
//       finished: new Date().toISOString(),
//     }),
//   );
// };
//
// const app = new Hono<AppBindings>({ strict: false })
//   .use(cors())
//   .use(envMiddleware)
//   .use(dbMiddleware)
//   .use(betterAuthMiddleware)
//   .post('/api/model', zValidator('json', bodySchema), async c => {
//     const body = c.req.valid('json');
//     c.executionCtx.waitUntil(
//       sendMessageToModel({
//         ...body,
//         db: c.get('db'),
//         apiKey: c.env.OPENROUTER_KEY,
//       }),
//     );
//     return c.json({ success: true });
//   })
//   .on(['POST', 'GET'], '/api/auth/*', c => {
//     const auth = c.get('auth');
//     return auth.handler(c.req.raw);
//   })
//   .onError((err, c) => {
//     if (err instanceof HttpError) {
//       return c.json({ error: err.message }, err.status);
//     }
//     return c.json({ error: err.message }, 500);
//   });
//
// export default app;
// export type ApiRoutes = typeof app;




import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "./uploadrouter";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    console.log('env', env);
    const handlers = createRouteHandler({
      router: uploadRouter,
      config: {
        /**
         * Since workers doesn't have envs on `process`. We need to pass
         * secret and isDev flag manually.
         */
        token: env.UPLOADTHING_SECRET,
        isDev: env.ENVIRONMENT === "production",
        /*
         * Cloudflare Workers doesn't support the cache option
         * so we need to remove it from the request init.
         */
        fetch: (url, init) => {
          if (init && "cache" in init) delete init.cache;
          return fetch(url, init);
        },
        /**
         * UploadThing dev server leaves some promises hanging around that we
         * need to wait for to prevent the worker from exiting prematurely.
         */
        handleDaemonPromise: (promise) => ctx.waitUntil(promise),
      },
    });

    // World's simplest router. Handle GET/POST requests to /api/uploadthing
    switch (new URL(request.url).pathname) {
      case "/api/uploadthing": {
        if (request.method !== "POST" && request.method !== "GET") {
          return new Response("Method not allowed", { status: 405 });
        }
        return await handlers[request.method](request);
      }
      default: {
        return new Response("Not found", { status: 404 });
      }
    }
  },
};
