import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
} from '@tanstack/react-router';
import { useUser } from '@web/hooks/use-user';
import { useEffect } from 'react';

export const Route = createFileRoute('/settings')({
  component: SettingsLayout,
});

function SettingsLayout() {
  const user = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user.isPending && user.type === 'guest') {
      navigate({ to: '/auth/$id', params: { id: 'sign-in' } });
    }
  }, [user, navigate]);

  if (user.isPending || user.type === 'guest') {
    return <div>Loading...</div>; // Or a spinner component
  }

  return (
    <div className='flex h-full'>
      <main className='flex-1 p-6'>
        <Outlet />
      </main>
    </div>
  );
}
