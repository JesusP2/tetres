import type { InstantSchemaDef } from '@instantdb/admin';
import type { InstantReactWebDatabase } from '@instantdb/react';
import type { Session, User } from 'better-auth';
import { useEffect } from 'react';

export function useInstantAuth({
  db,
  sessionData,
  isPending,
}: {
  db: InstantReactWebDatabase<InstantSchemaDef<any, any, any>>;
  sessionData?: { session: Session; user: User } | null;
  isPending: boolean;
}) {
  const { user, isLoading } = db.useAuth();

  useEffect(() => {
    if (isPending || isLoading) return;

    async function getUser() {
      if (sessionData) {
        if (!user || user.id !== sessionData.user.id) {
          db.auth.signInWithToken(sessionData.session.token);
        }
      }
    }
    getUser();
  }, [db, isPending, isLoading, sessionData, user]);
}
