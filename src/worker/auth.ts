import { instantDBAdapter } from '@daveyplate/better-auth-instantdb';
import { betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins';
import { passkey } from 'better-auth/plugins/passkey';
import { env as cloudflareEnv } from 'cloudflare:workers';
import { getDb } from './db';

export const createAuth = (env: typeof cloudflareEnv) => {
  const adminDb = getDb(env);
  console.log('ENVS PLEASE DO NOT READ THESE LOGS:', env)
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    plugins: [
      passkey(),
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          console.log('send magic link', email, url);
          // await resend.emails.send({
          //   from: EMAIL_FROM,
          //   to: email,
          //   subject: 'Magic link',
          //   react: magicLinkTemplate(url),
          // });
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
      sendResetPassword: async ({ user, token }) => {
        console.log('send reset password', user, token);
        // const url = BASE_URL + "/auth/reset-password/" + token;
        // await resend.emails.send({
        //   from: EMAIL_FROM,
        //   to: user.email,
        //   subject: "Reset password",
        //   react: forgotPasswordTemplate(url),
        // });
      },
    },
    socialProviders: {
      google: {
        enabled: true,
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        // clientId: process.env.GOOGLE_CLIENT_ID!,
        // clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
  });
};
export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth['$Infer']['Session']['session'];
export type User = Auth['$Infer']['Session']['user'];
