import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router';
import { useUser } from '@web/hooks/use-user';

export const Route = createFileRoute('/settings')({
  component: SettingsLayout,
});

function SettingsLayout() {
  const user = useUser();

  if (!user.isPending && !user.data) {
    return <Navigate to='/auth/$id' params={{ id: 'sign-in' }} />;
  }

  return (
    <div className='flex h-full'>
      <main className='flex-1 p-6'>
        <Outlet />
      </main>
    </div>
  );
}
