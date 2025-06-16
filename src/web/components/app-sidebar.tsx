import { Link } from '@tanstack/react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from '@web/components/ui/sidebar';
import { ShellIcon } from 'lucide-react';
import * as React from 'react';
import { ChatList } from './chat-list';
import { NavUser } from './nav-user';
import { ProjectButton } from './project-button';
import { ProjectList } from './project-list';
import { ThemeButton } from './theme-button';
import { buttonVariants } from './ui/button';
import { SettingsIcon } from './ui/settings';

export function AppSidebar({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar collapsible='offcanvas'>
        <SidebarHeader className='mt-2'>
          <div className='flex items-center gap-2'>
            <h2 className='mx-2 text-lg font-semibold flex items-center gap-2'>
              <ShellIcon />
              Omokage
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent className='overflow-hidden'>
          <div className='flex flex-col gap-4 p-4 py-0'>
            <ProjectButton />
          </div>
          <ProjectList />
          <ChatList />
        </SidebarContent>
        <SidebarFooter className='mb-2'>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarTrigger className='sticky' />
      {children}
      <div className='absolute top-1 right-8 flex items-center'>
        <ThemeButton />
        <Link
          to='/settings'
          className={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            className: 'size-8',
          })}
        >
          <SettingsIcon size={16} />
        </Link>
      </div>
    </>
  );
}
