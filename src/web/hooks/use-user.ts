import type { User } from '@instantdb/core';
import { authClient } from '@web/lib/auth-client';
import { db } from '@web/lib/instant';

export type MyUser =
  | {
      isPending: true;
      data: null;
    }
  | {
      isPending: false;
      data:
        | (User & {
            name?: string;
            image?: string | null;
          })
        | null
        | undefined;
    };
export function useUser(): MyUser {
  const { user, isLoading } = db.useAuth();
  const sessionData = authClient.useSession();
  if (isLoading || sessionData.isPending) {
    return {
      isPending: true,
      data: null,
    };
  }
  if (!user) {
    return {
      isPending: false,
      data: null,
    };
  }
  return {
    isPending: isLoading || sessionData.isPending,
    data: {
      ...user,
      name: sessionData.data?.user?.name,
      image: sessionData.data?.user?.image,
    },
  };
}
