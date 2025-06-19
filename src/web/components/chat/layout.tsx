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


  return (
    <SidebarProvider defaultOpen={defaultOpen} defaultWidth={sidebarWidth}>
      <AppSidebar>
        <AppSidebarInset>{children}</AppSidebarInset>
      </AppSidebar>
    </SidebarProvider>
  );
}
