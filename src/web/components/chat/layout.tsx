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
import { useUser } from '@web/hooks/use-user';

type ProviderProps = {
  children: React.ReactNode;
};

function getCookieValue(name: string) {
  const value = document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`)?.[2];
  return value;
}

export function ChatLayout({ children }: ProviderProps) {
  const sidebarState = getCookieValue('sidebar:state') ?? 'false';
  const sidebarWidth = getCookieValue('sidebar:width') ?? SIDEBAR_WIDTH;
  const defaultOpen = sidebarState === 'true';
  const user = useUser();

  // Show dialog when user is not logged in and not pending
  const showAuthDialog = !user.isPending && !user.data;

  return (
    <SidebarProvider defaultOpen={defaultOpen} defaultWidth={sidebarWidth}>
      <AppSidebar>
        <AppSidebarInset>{children}</AppSidebarInset>
      </AppSidebar>
      
      <Dialog open={showAuthDialog}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
            <DialogDescription>
              You need to sign in to access the chat functionality.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button asChild>
              <Link to="/auth/$id" params={{ id: 'sign-in' }}>
                Sign In
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
