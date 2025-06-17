import type { InstantSchemaDef } from '@instantdb/admin';
import type { InstantReactWebDatabase } from '@instantdb/react';
import type { Session, User } from 'better-auth';
import { useEffect, useState } from 'react';

export function useInstantAuth({
  db,
  sessionData,
  isPending,
}: {
  // biome-ignore lint/suspicious/noExplicitAny:
  db: InstantReactWebDatabase<InstantSchemaDef<any, any, any>>;
  sessionData?: { session: Session; user: User } | null;
  isPending: boolean;
}) {
  const { user: _user, isLoading } = db.useAuth();
  const [user, setUser] = useState(_user);

  useEffect(() => {
    if (isPending || isLoading) return;

    async function getUser() {
      if (sessionData) {
        if (!user || user.id !== sessionData.user.id) {
          const { user } = await db.auth.signInWithToken(
            sessionData.session.token,
          );
          setUser(user);
        }
      } else {
        db.auth.signOut({ invalidateToken: false });
      }
    }
    getUser();
  }, [db, isPending, isLoading, sessionData, _user]);
}
