import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from '@web/components/ui/sidebar';
import { useUser } from '@web/hooks/use-user';
import * as React from 'react';
import { ChatList } from './chat-list';
import { NavUser } from './nav-user';

export function AppSidebar({ children }: { children: React.ReactNode }) {

  return (
    <>
      <Sidebar collapsible='offcanvas'>
        <SidebarHeader className='mt-2'>
          <div className='flex items-center gap-2'>
            <h2 className='text-lg font-semibold'>Name.chat</h2>
          </div>
        </SidebarHeader>
        <SidebarContent className='overflow-hidden'>
          <ChatList />
        </SidebarContent>
        <SidebarFooter className='mb-2'>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarTrigger className='sticky' />
      {children}
    </>
  );
}
