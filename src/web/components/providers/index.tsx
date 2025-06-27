import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import { IsOnlineProvider, useIsOnline } from './is-online';
import { useInstantOptions } from '@daveyplate/better-auth-ui/instantdb';
import { Link, useNavigate } from '@tanstack/react-router';
import { authClient, useSession } from '@web/lib/auth-client';
import { db } from '@web/lib/instant';
import { ConfirmDialogProvider } from './confirm-dialog-provider';
import { ThemeProvider } from './theme-provider';
import { useEffect } from 'react';

function NavLink({ href, children }: any) {
  return <Link to={href}>{children}</Link>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <IsOnlineProvider>
        <InnerProviders>{children}</InnerProviders>
      </IsOnlineProvider>
    </ThemeProvider>
  );
}

export function InnerProviders({ children }: { children: React.ReactNode }) {
  const { isOnline, isChecking } = useIsOnline();
  const navigate = useNavigate();
  const { user, isLoading } = db.useAuth();
  const { data: sessionData, isPending } = useSession();
  const { hooks, mutators } = useInstantOptions({
    db,
    sessionData,
    user,
    usePlural: true,
    isPending,
  });

  useEffect(() => {
    if (isPending || isLoading || isChecking) return;

    async function getUser() {
      if (sessionData) {
        if (!user || user.id !== sessionData.user.id) {
          await db.auth.signInWithToken(sessionData.session.token);
        }
      } else if (isOnline) {
        console.log("couldnt get session and you're online, revoking token")
        await db.auth.signOut({ invalidateToken: false });
      //   const data = await authClient.signIn.anonymous();
      //   if (data.data) {
      //     console.log("signed in anonymously")
      //     await db.auth.signInWithToken(data.data.token);
      //   }
      }
    }
    getUser();
  }, [db, isPending, isLoading, sessionData, user]);

  return (
    <AuthUIProvider
      authClient={authClient}
      hooks={hooks}
      mutators={mutators}
      Link={NavLink}
      navigate={href => navigate({ to: href })}
      magicLink
      passkey
      providers={['google']}
    >
      <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
    </AuthUIProvider>
  );
}
