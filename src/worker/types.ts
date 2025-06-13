import type { InstantAdminDatabase } from '@instantdb/admin';
import { env } from 'cloudflare:workers';
import { Hono } from 'hono';
import type { Auth, Session, User } from '@server/auth';
import { AppSchema } from '../../instant.schema';
import { bodySchema } from './schemas';
import { z } from 'zod/v4';

export interface AppBindings {
  Bindings: typeof env;
  Variables: {
    auth: Auth;
    db: InstantAdminDatabase<AppSchema>;
    session: Session;
    user: User;
  };
}

export type AppOpenAPI = Hono<AppBindings>;
export type Body = z.infer<typeof bodySchema>;
