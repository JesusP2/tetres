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

  const dummyUser = {
    isPending: false as const,
    type: 'user' as const,
    data: {
      name: 'Lotus',
      email: 'jesus_perez99@hotmail.com',
      emailVerified: false,
      image:
        'https://h0rziolxhf.ufs.sh/f/ioU2sXfpGCc9AjSQPPGoLXsWhN2pMEzlx9OniDPdwRaFBY45',
      createdAt: new Date('2025-06-09T06:43:16.576Z'),
      updatedAt: new Date('2025-06-09T06:43:16.576Z'),
      id: '5b21b5b2-638f-4519-96fd-7e94c3a0aa22',
    },
  };
  return user;
  // return dummyUser;
}
