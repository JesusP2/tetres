import { Link } from '@tanstack/react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@web/components/ui/sidebar';
import { SearchIcon, SettingsIcon, ShellIcon } from 'lucide-react';
import * as React from 'react';
import { NavUser } from '../nav-user';
import { ThemeButton } from '../theme-button';
import { Button, buttonVariants } from '../ui/button';
import { Content } from './sidebar-content';
import { cn } from '@web/lib/utils';
import { useState } from 'react';

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  return (
    <>
      <Sidebar collapsible='offcanvas'>
        <SidebarHeader className='mt-2'>
          <div className='flex items-center gap-2 mx-auto'>
            <h2 className='mx-2 flex items-center gap-2 text-lg font-semibold'>
              <ShellIcon />
              Omokage
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent className='overflow-hidden'>
          <Content searchDialogOpen={searchDialogOpen} setSearchDialogOpen={setSearchDialogOpen} />
        </SidebarContent>
        <SidebarFooter className='mb-2'>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <div className={cn('absolute z-10 top-3 left-2 p-1 rounded-sm duration-300 ease-in-out bg-sidebar flex gap-2', state === 'collapsed' ? 'w-18' : 'w-9')}>
        <SidebarTrigger className="z-10" />
        <Button onClick={() => setSearchDialogOpen(open => !open)} size="icon" className={cn('h-7 w-7 relative duration-300', state === 'collapsed' ? 'right-0' : 'right-7 opacity-0')} variant="ghost">
          <SearchIcon />
        </Button>
      </div>
      {children}
      <div className='absolute top-3 right-8 flex items-center bg-sidebar p-1 rounded-sm'>
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
