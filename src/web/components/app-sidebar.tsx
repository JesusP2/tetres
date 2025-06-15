import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from '@web/components/ui/sidebar';
import * as React from 'react';
import { ChatList } from './chat-list';
import { NavUser } from './nav-user';
import { ThemeButton } from './theme-button';
import { Link } from '@tanstack/react-router';
import { SettingsIcon } from './ui/settings';
import { buttonVariants } from './ui/button';

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
      <SidebarTrigger className="sticky" />
      {children}
      <div className="absolute right-8 top-1 flex items-center">
        <ThemeButton />
        <Link to='/settings' className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'size-8' })}>
          <SettingsIcon size={16} />
        </Link>
      </div>
    </>
  );
}
