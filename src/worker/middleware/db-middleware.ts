import { createMiddleware } from 'hono/factory';
import { AppBindings } from '@server/types';
import { getDb } from '@server/db';

export const dbMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  const db = getDb(c.env);
  c.set('db', db);
  await next();
});
