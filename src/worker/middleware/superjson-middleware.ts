import { createMiddleware } from 'hono/factory';
import superjson from 'superjson';

export const superjsonMiddleware = createMiddleware(async (c, next) => {
  c.req.json = async () => {
    const text = await c.req.text();
    const text2 = JSON.parse(text);
    return superjson.parse(text2);
  };
  await next();
});
