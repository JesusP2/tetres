import { passkeyClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: import.meta.env.BASE_URL,
  plugins: [passkeyClient()],
});
export const { useSession } = authClient;
