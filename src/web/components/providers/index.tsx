import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import { IsOnlineProvider, useIsOnline } from './is-online';
import { useInstantOptions } from '@daveyplate/better-auth-ui/instantdb';
import { Link, useNavigate } from '@tanstack/react-router';
import { authClient, useSession } from '@web/lib/auth-client';
import { db } from '@web/lib/instant';
import { ConfirmDialogProvider } from './confirm-dialog-provider';
import { ThemeProvider } from './theme-provider';
import { createContext, useContext, useEffect, useState } from 'react';

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
  const { user } = db.useAuth();
  const sessionData = useSession();
  const { hooks, mutators } = useInstantOptions({
    db,
    sessionData: sessionData.data,
    user,
    usePlural: true,
    isPending: sessionData.isPending,
  });

  return (
    <AuthUIProvider
      authClient={authClient}
      hooks={hooks}
      mutators={mutators}
      Link={NavLink}
      navigate={href => window.location.href = href}
      magicLink
      passkey
      providers={['google']}
    >
      <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
    </AuthUIProvider>
  );
}
