import { betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins';
import { passkey } from 'better-auth/plugins/passkey';
import { env as cloudflareEnv } from 'cloudflare:workers';
import { Resend } from 'resend';
import { getDb } from './db';
import { magicLinkTemplate } from './emails/magic-link';
import { forgotPasswordTemplate } from './emails/otp';
import { instantDBAdapter } from './instant-adapteer';

export const createAuth = (env: typeof cloudflareEnv) => {
  const adminDb = getDb(env);

  const resend = new Resend(env.RESEND_API_KEY);
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    plugins: [
      passkey(),
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          console.log('i hate my life:', url, env.BASE_URL);
          await resend.emails.send({
            from: 'no-reply@omokage.app',
            to: email,
            subject: 'Magic link',
            react: magicLinkTemplate(url, env.BASE_URL),
          });
        },
      }),
    ],
    database: instantDBAdapter({
      db: adminDb,
      usePlural: true,
      debugLogs: true,
    }),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        await resend.emails.send({
          from: 'no-reply@omokage.app',
          to: user.email,
          subject: 'Reset password',
          react: forgotPasswordTemplate(url, env.BASE_URL),
        });
      },
    },
    socialProviders: {
      google: {
        enabled: true,
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
  });
};
export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth['$Infer']['Session']['session'];
export type User = Auth['$Infer']['Session']['user'];
