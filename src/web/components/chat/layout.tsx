import { Link } from '@tanstack/react-router';
import { AppSidebar } from '@web/components/sidebar';
import { AppSidebarInset } from '@web/components/sidebar/inset';
import { Button } from '@web/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@web/components/ui/dialog';
import { SIDEBAR_WIDTH, SidebarProvider } from '@web/components/ui/sidebar';
import type { User } from 'better-auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { useIsOnline } from '../providers/is-online';
import { db } from '@web/lib/instant';
import { useSession } from '@web/lib/auth-client';

type ProviderProps = {
  children: React.ReactNode;
};

function getCookieValue(name: string) {
  const value = document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`)?.[2];
  return value;
}

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
      isAnonymous: boolean;
    })
    | null
    | undefined;
  };

type ChatAuthProvider = MyUser;

const ChatAuthProviderContext = createContext<ChatAuthProvider>({
  isPending: true,
  data: null,
});

export const useUser = () => {
  const context = useContext(ChatAuthProviderContext);
  if (context === undefined)
    throw new Error('useUser must be used within an InnerProviders');

  return context;
};

export function ChatAuthProvider({ children }: ProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { isOnline, isChecking } = useIsOnline();
  const { user, isLoading: isUserLoading } = db.useAuth();
  const sessionData = useSession();
  const sidebarState = getCookieValue('sidebar:state') ?? 'false';
  const sidebarWidth = getCookieValue('sidebar:width') ?? SIDEBAR_WIDTH;
  const defaultOpen = sidebarState === 'true';
  const showAuthDialog = !isLoading && !user;

  useEffect(() => {
    if (sessionData.isPending || isUserLoading || isChecking) return;

    async function getUser() {
      try {
        if (sessionData.data) {
          if (!user || user.id !== sessionData.data?.user.id) {
            await db.auth.signInWithToken(sessionData.data?.session.token || '');
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
      } catch (error) {
        console.error('Failed to get user:', error);
      } finally {
        setIsLoading(false);
      }
    }
    getUser();
  }, [db, sessionData.isPending, isUserLoading, sessionData, user]);

  return (
    <ChatAuthProviderContext.Provider value={{
      isPending: isLoading, data: isLoading || !user ? null : {
        ...user,
        name: sessionData.data?.user?.name,
        image: sessionData.data?.user?.image,
        isAnonymous: sessionData.data?.user?.isAnonymous || false,
      }
    } as MyUser}>
      <SidebarProvider defaultOpen={defaultOpen} defaultWidth={sidebarWidth}>
        <AppSidebar>
          <AppSidebarInset>{children}</AppSidebarInset>
        </AppSidebar>

        {!window.location.pathname.includes('shared') && (
          <Dialog open={showAuthDialog}>
            <DialogContent showCloseButton={false} className='sm:max-w-md'>
              <DialogHeader>
                <DialogTitle>Authentication Required</DialogTitle>
                <DialogDescription>
                  You need to sign in to access the chat functionality.
                </DialogDescription>
              </DialogHeader>
              <div className='flex justify-center pt-4'>
                <Button asChild>
                  <Link to='/auth/$id' params={{ id: 'sign-in' }}>
                    Sign In
                  </Link>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </SidebarProvider>
    </ChatAuthProviderContext.Provider>
  );
}
