import { Session } from 'better-auth';
import { createMiddleware } from 'hono/factory';
import { createAuth, type User } from '@server/auth';
import { AppBindings } from '@server/types';
import { HttpError } from '@server/utils/http-error';

export const betterAuthMiddleware = createMiddleware<AppBindings>(
  async (c, next) => {
    const auth = createAuth(c.env);
    c.set('auth', auth);

    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    const url = new URL(c.req.url);
    console.log(session, url, url.pathname)
    if (!session && !url.pathname.startsWith('/api/auth')) {
      console.log('redirecting:', '/api/auth/login')
      throw new HttpError('Unauthorized', 401);
    }

    c.set('user', session?.user as User);
    c.set('session', session?.session as Session);

    await next();
  },
);
