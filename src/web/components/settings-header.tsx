import { Link } from '@tanstack/react-router';
import { authClient } from '@web/lib/auth-client';
import { ArrowLeft } from 'lucide-react';
import { ThemeButton } from './theme-button';
import { Button, buttonVariants } from './ui/button';

export function SettingsHeader() {
  return (
    <div className='flex items-center justify-between gap-2'>
      <Link to='/' className={buttonVariants({ variant: 'ghost' })}>
        <ArrowLeft className='h-4 w-4' />
        Go Back
      </Link>
      <div className='flex gap-2'>
        <ThemeButton />
        <Button
          variant='outline'
          onClick={async () => {
            await authClient.signOut();
            window.location.href = '/';
          }}
        >
          Log out
        </Button>
      </div>
    </div>
  );
}
