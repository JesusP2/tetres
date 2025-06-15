import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useUser } from '@web/hooks/use-user';
import { useEffect } from 'react';

export const Route = createFileRoute('/settings')({
  component: SettingsLayout,
});

function SettingsLayout() {
  const user = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user.isPending && !user.data) {
      navigate({ to: '/auth/$id', params: { id: 'sign-in' } });
    }
  }, [user, navigate]);

  if (user.isPending) {
    return <div>Loading...</div>;
  }

  return (
    <div className='flex h-full'>
      <main className='flex-1 p-6'>
        <Outlet />
      </main>
    </div>
  );
}
