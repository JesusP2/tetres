import {
  checkout,
  polar,
  portal,
  usage,
} from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import { betterAuth } from 'better-auth';
import { anonymous, magicLink } from 'better-auth/plugins';
import { passkey } from 'better-auth/plugins/passkey';
import { Resend } from 'resend';
import { getDb } from './db';
import { magicLinkTemplate } from './emails/magic-link';
import { forgotPasswordTemplate } from './emails/otp';
import { instantDBAdapter } from './instant-adapteer';
import { AppBindings } from './types';

export const createAuth = (env: AppBindings['Bindings']) => {
  const adminDb = getDb(env);
  // const polarClient = new Polar({
  //   accessToken: env.POLAR_ACCESS_TOKEN,
  //   server: 'sandbox',
  // });

  const resend = new Resend(env.RESEND_API_KEY);
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    plugins: [
      anonymous({
        emailDomainName: 'omokage.app',
      }),
      // polar({
      //   client: polarClient,
      //   createCustomerOnSignUp: true,
      //   use: [
      //     checkout({
      //       products: [
      //         {
      //           productId: '96008e65-aac2-4bd7-89a4-f97bcb693fa0',
      //           slug: 'test',
      //         },
      //       ],
      //       successUrl: '/success?checkout_id={CHECKOUT_ID}',
      //       authenticatedUsersOnly: true,
      //     }),
      //     portal(),
      //     usage(),
      //     // webhooks({
      //     //     secret: process.env.POLAR_WEBHOOK_SECRET,
      //     //     onCustomerStateChanged: (payload) => // Triggered when anything regarding a customer changes
      //     //     onOrderPaid: (payload) => // Triggered when an order was paid (purchase, subscription renewal, etc.)
      //     //     ...  // Over 25 granular webhook handlers
      //     //     onPayload: (payload) => // Catch-all for all events
      //     // })
      //   ],
      // }),
      passkey(),
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await resend.emails.send({
            from: 'no-reply@omokage.app',
            to: email,
            subject: 'Magic link',
            react: magicLinkTemplate(url, env.VITE_CLIENT_APP_URL),
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
          react: forgotPasswordTemplate(url, env.VITE_CLIENT_APP_URL),
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
