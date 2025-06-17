import { SidebarInset } from '@web/components/ui/sidebar';

export function AppSidebarInset({ children }: { children: React.ReactNode }) {
  return <SidebarInset className='overflow-x-hidden'>{children}</SidebarInset>;
}
