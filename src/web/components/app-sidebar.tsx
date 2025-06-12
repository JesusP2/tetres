import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from '@web/components/ui/sidebar';
import * as React from 'react';
import { NavUser } from './nav-user';
import { useUser } from '@web/hooks/use-user';
import { ChatList } from './chat-list';


export function AppSidebar({ children }: { children: React.ReactNode }) {
  const user = useUser();

  return (
    <>
      <Sidebar collapsible='icon'>
        <SidebarHeader className='mt-2'>
          <div className='flex items-center gap-2'>
            <SidebarTrigger className='sticky' />
            <h2 className='text-lg font-semibold'>T3.chat</h2>
          </div>
        </SidebarHeader>
        <SidebarContent className='overflow-hidden'>
          <ChatList user={user} />
        </SidebarContent>
        <SidebarFooter className='mb-2'>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      {children}
    </>
  );
}
