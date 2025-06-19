import type { InstantAdminDatabase } from '@instantdb/admin';
import { env } from 'cloudflare:workers';
import { Hono } from 'hono';
import { z } from 'zod/v4';
import type { Auth, Session, User } from '@server/auth';
import { AppSchema } from '../../instant.schema';
import { AIModelDurableObject } from './durable-objects/ai-mkodel-do';
import {
  bodySchema,
  filePartSchema,
  imagePartSchema,
  textPartSchema,
} from './schemas';

export interface AppBindings {
  Bindings: typeof env & {
    AI_MODEL_DO: DurableObjectNamespace<AIModelDurableObject>;
  };
  Variables: {
    auth: Auth;
    db: InstantAdminDatabase<AppSchema>;
    session: Session;
    user: User;
  };
}

export type AppOpenAPI = Hono<AppBindings>;
export type Body = z.infer<typeof bodySchema>;
export type APIMessage = Body['messages'][number];
export type TextPart = z.infer<typeof textPartSchema>;
export type FilePart = z.infer<typeof filePartSchema>;
export type ImagePart = z.infer<typeof imagePartSchema>;
