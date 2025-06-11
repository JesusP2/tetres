import { AuthCard } from '@daveyplate/better-auth-ui';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useParams } from '@tanstack/react-router';
import { buttonVariants } from '@web/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/auth/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: '/auth/$id' });

  return (
    <main className='container m-auto grid h-screen place-items-center'>
      <Link
        to='/'
        className={buttonVariants({
          variant: 'ghost',
          className: 'absolute top-4 left-4',
        })}
      >
        <ArrowLeft className='h-4 w-4' />
        Go back to chat
      </Link>
      <AuthCard pathname={id} />
    </main>
  );
}
