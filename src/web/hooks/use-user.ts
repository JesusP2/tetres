import { authClient } from '@web/lib/auth-client';
import type { User } from 'better-auth';

type MyUser =
  | {
      isPending: true;
      data: null;
    }
  | {
      isPending: false;
      data: User;
    };
export function useUser(): MyUser {
  const session = authClient.useSession();
  if (session.isPending) {
    return {
      isPending: true,
      data: null,
    };
  }
  return {
    isPending: session.isPending,
    data: session.data?.user as User,
  };
}
