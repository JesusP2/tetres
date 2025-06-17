import { Link } from '@tanstack/react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from '@web/components/ui/sidebar';
import { SettingsIcon, ShellIcon } from 'lucide-react';
import * as React from 'react';
import { NavUser } from '../nav-user';
import { ThemeButton } from '../theme-button';
import { buttonVariants } from '../ui/button';
import { Content } from './sidebar-content';

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
          <Content />
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
