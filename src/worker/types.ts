import { InstantAdminDatabase } from '@instantdb/admin';
import { env } from 'cloudflare:workers';
import { Hono } from 'hono';
import type { Auth, Session, User } from '@server/auth';
import { AppSchema } from '../../instant.schema';

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
