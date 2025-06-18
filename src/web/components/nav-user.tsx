import { Link } from '@tanstack/react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@web/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@web/components/ui/sidebar';
import { useUser } from '@web/hooks/use-user';
import { authClient } from '@web/lib/auth-client';
import { db } from '@web/lib/instant';
import { buttonVariants } from './ui/button';
import { LoaderCircleIcon } from 'lucide-react';

export function NavUser() {
  const { isMobile } = useSidebar();
  const user = useUser();

  if (user.isPending) {
    return <div className="flex justify-center"><LoaderCircleIcon className="animate-spin h-5 w-5" /></div>;
  } else if (!user.data) {
    return (
      <Link
        className={buttonVariants()}
        to='/auth/$id'
        params={{ id: 'sign-in' }}
      >
        Login
      </Link>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <Avatar className='h-8 w-8 rounded-lg grayscale'>
                <AvatarImage src={user.data.image ?? ''} alt={user.data.name} />
                <AvatarFallback className='rounded-lg'>CN</AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-medium'>{user.data.name}</span>
                <span className='text-muted-foreground truncate text-xs'>
                  {user.data.email}
                </span>
              </div>
              {/*<IconDotsVertical className="ml-auto size-4" />*/}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <Avatar className='h-8 w-8 rounded-lg grayscale'>
                  <AvatarImage
                    src={user.data.image ?? ''}
                    alt={user.data.name}
                  />
                  <AvatarFallback className='rounded-lg'>CN</AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>{user.data.name}</span>
                  <span className='text-muted-foreground truncate text-xs'>
                    {user.data.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to='/settings'>Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to='/settings/account'>Account</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to='/settings/api-keys'>API Keys</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await authClient.signOut();
                await db.auth.signOut();
                window.location.href = '/';
              }}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
