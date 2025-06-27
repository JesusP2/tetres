import type { InstantAdminDatabase } from '@instantdb/admin';
import { Hono } from 'hono';
import { z } from 'zod/v4';
import type { Auth, Session, User } from '@server/auth';
import { AppSchema } from '../../instant.schema';
import { AIModelDurableObject } from './durable-objects/ai-model-do';
import {
  bodySchema,
  filePartSchema,
  imagePartSchema,
  textPartSchema,
} from './schemas';

export interface AppBindings {
  Bindings: {
    omokage_rate_limit: KVNamespace;
    BETTER_AUTH_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    VITE_INSTANT_APP_ID: string;
    INSTANT_ADMIN_TOKEN: string;
    GOOGLE_REDIRECT_URI: string;
    UPLOADTHING_TOKEN: string;
    OPENROUTER_KEY: string;
    RESEND_API_KEY: string;
    VITE_CLIENT_APP_URL: string;
    OPENAI_API_KEY: string;
    POLAR_ACCESS_TOKEN: string;
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
