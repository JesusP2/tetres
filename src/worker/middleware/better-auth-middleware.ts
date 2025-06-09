import { Session } from 'better-auth';
import { createMiddleware } from 'hono/factory';
import { createAuth, type User } from '@server/auth';
import { AppBindings } from '@server/types';
import { HttpError } from '@server/utils/http-error';

export const betterAuthMiddleware = createMiddleware<AppBindings>(
  async (c, next) => {
    const auth = createAuth(c.env);
    c.set('auth', auth);

    let session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (import.meta.env.DEV && !session) {
      session = {
        session: {
          id: 'dev',
          userId: 'dev',
          token: 'dev',
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'dev',
        },
        user: {
          id: 'dev',
          name: 'dev',
          createdAt: new Date(),
          updatedAt: new Date(),
          image: null,
          email: 'dev@dev.dev',
          emailVerified: false,
        },
      };
    }
    if (!session && !import.meta.env.DEV) {
      throw new HttpError('Unauthorized', 401);
    }

    c.set('user', session?.user as User);
    c.set('session', session?.session as Session);

    await next();
  },
);
