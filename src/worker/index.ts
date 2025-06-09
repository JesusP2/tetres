import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { betterAuthMiddleware } from './middleware/better-auth-middleware';
import { envMiddleware } from './middleware/env-middleware';
import { AppBindings } from './types';
import { HttpError } from './utils/http-error';
import { dbMiddleware } from './middleware/db-middleware';
// import { superjsonMiddleware } from './middleware/superjson-middleware';

const app = new Hono<AppBindings>({ strict: false })
  .use(cors())
  .use(envMiddleware)
  .use(dbMiddleware)
  .use(betterAuthMiddleware)
  // .use(superjsonMiddleware)
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
