import { AppSidebar } from "@web/components//app-sidebar";
import { AppSidebarInset } from "@web/components/app-sidebar-inset";
import { SIDEBAR_WIDTH, SidebarProvider } from "@web/components/ui/sidebar";

type ProviderProps = {
  children: React.ReactNode;
};

export async function ChatLayout({ children }: ProviderProps) {
  let sidebarState: string | null = null;
  let sidebarWidth: string | null = SIDEBAR_WIDTH;
  document.cookie.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    if (parts[0] === "sidebar:state") {
      sidebarState = parts[1];
    }
    if (parts[0] === "sidebar:width") {
      sidebarWidth = parts[1];
    }
  });
  console.log(sidebarState, sidebarWidth)

  let defaultOpen = true;

  if (sidebarState) {
    defaultOpen = sidebarState === "true";
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen} defaultWidth={sidebarWidth} >
      <AppSidebar>
        <AppSidebarInset>{children}</AppSidebarInset>
      </AppSidebar>
    </SidebarProvider>
  );
}
