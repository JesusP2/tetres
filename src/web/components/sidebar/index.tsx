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
import { cn } from '@web/lib/utils';
import { SearchIcon, SettingsIcon, ShellIcon } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { NavUser } from '../nav-user';
import { ThemeButton } from '../theme-button';
import { Button, buttonVariants } from '../ui/button';
import { Content } from './sidebar-content';

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  return (
    <>
      <Sidebar collapsible='offcanvas'>
        <SidebarHeader className='mt-2'>
          <div className='mx-auto flex items-center gap-2'>
            <h2 className='mx-2 text-lg font-semibold'>
              <Link to='/' className='flex items-center gap-2'>
                <ShellIcon />
                Omokage
              </Link>
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent className='overflow-hidden'>
          <Content
            searchDialogOpen={searchDialogOpen}
            setSearchDialogOpen={setSearchDialogOpen}
          />
        </SidebarContent>
        <SidebarFooter className='mb-2'>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <div
        className={cn(
          'bg-sidebar absolute top-3 left-2 z-10 flex gap-2 rounded-sm p-1 duration-300 ease-in-out',
          state === 'collapsed' ? 'w-18' : 'w-9',
        )}
      >
        <SidebarTrigger className='z-10' />
        <Button
          onClick={() => setSearchDialogOpen(open => !open)}
          size='icon'
          className={cn(
            'relative h-7 w-7 duration-300',
            state === 'collapsed' ? 'right-0' : 'right-7 opacity-0',
          )}
          variant='ghost'
        >
          <SearchIcon />
        </Button>
      </div>
      {children}
      <div className='bg-sidebar absolute top-3 right-8 flex hidden items-center rounded-sm p-1 sm:flex'>
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
