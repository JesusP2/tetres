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
import { ProjectButton } from './project-button';
import { ProjectList } from './project-list';

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
          <div className='flex flex-col h-full'>
            <div className='p-4 space-y-4'>
              <ProjectButton />
            </div>
            <ProjectList />
            <ChatList />
          </div>
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
