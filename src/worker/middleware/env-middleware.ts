import { env } from 'hono/adapter';
import { createMiddleware } from 'hono/factory';

export const envMiddleware = createMiddleware(async (c, next) => {
  c.env = env(c);
  await next();
});
