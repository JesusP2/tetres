import { createMiddleware } from 'hono/factory';
import { getDb } from '@server/db';
import { AppBindings } from '@server/types';

export const dbMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  const db = getDb(c.env);
  c.set('db', db);
  await next();
});
