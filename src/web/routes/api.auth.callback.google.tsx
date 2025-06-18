import { createFileRoute, Link } from '@tanstack/react-router';
import { Alert, AlertDescription, AlertTitle } from '@web/components/ui/alert';
import { buttonVariants } from '@web/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/api/auth/callback/google')({
  component: RouteComponent,
});

function RouteComponent() {
  const [isLoading, setIsLoading] = useState(true);
  async function sendState() {
    const response = await fetch(
      '/api/auth/callback/google' + window.location.search,
    );
    if (response.ok) {
      window.location.href = '/';
    }
    setIsLoading(false);
  }
  useEffect(() => {
    sendState();
  }, []);
  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center p-4'>
        <div className='w-full max-w-md'>
          <Alert variant='default'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Authenticating...</AlertTitle>
            <AlertDescription></AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }
  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <Alert variant='default'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Authentication Failed</AlertTitle>
          <AlertDescription>
            Failed to authenticate with Google, this account may already be
            linked to another user.
            <Link
              to='/auth/$id'
              params={{ id: 'sign-in' }}
              className={buttonVariants({
                variant: 'link',
                className: 'pl-0',
              })}
            >
              Go to sign in
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
