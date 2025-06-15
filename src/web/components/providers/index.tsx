import { useInstantAuth } from '@daveyplate/better-auth-instantdb';
import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import { useInstantOptions } from '@daveyplate/better-auth-ui/instantdb';
import { Link, useNavigate } from '@tanstack/react-router';
import { authClient, useSession } from '@web/lib/auth-client';
import { db } from '@web/lib/instant';
import { ConfirmDialogProvider } from './confirm-dialog-provider';
import { ThemeProvider } from './theme-provider';
import { ThemeButton } from '../theme-button';

function NavLink({ href, children }: any) {
  return <Link to={href}>{children}</Link>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user } = db.useAuth();
  const { data: sessionData, isPending } = useSession();
  useInstantAuth({ db, sessionData, isPending });
  const { hooks, mutators } = useInstantOptions({
    db,
    sessionData,
    user,
    usePlural: true,
    isPending,
  });

  return (
    <ThemeProvider defaultTheme="modern-minimal">
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
    </ThemeProvider>
  );
}
