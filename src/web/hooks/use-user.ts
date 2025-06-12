import { id } from '@instantdb/core';
import { authClient } from '@web/lib/auth-client';
import type { User } from 'better-auth';
import { useEffect, useState } from 'react';

function getGuestUser() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    const userId = id();
    localStorage.setItem('userId', userId);
    return userId;
  }
  return userId;
}

type LoggedInUser = {
  isPending: false;
  type: 'user';
  data: User;
};

type GuestUser = {
  isPending: false;
  type: 'guest';
  data: {
    id: string;
  };
};

export type MyUser =
  | {
      isPending: true;
    }
  | GuestUser
  | LoggedInUser;

export function useUser(): MyUser {
  const session = authClient.useSession();
  const [user, setUser] = useState<MyUser>({
    isPending: true,
  });

  useEffect(() => {
    if (session.isPending) return;

    if (session.data?.session?.userId) {
      setUser({
        isPending: false,
        type: 'user',
        data: session.data.user,
      });
    } else {
      setUser({
        isPending: false,
        type: 'guest',
        data: {
          id: getGuestUser(),
        },
      });
    }
  }, [session.isPending]);

  return user;
}
