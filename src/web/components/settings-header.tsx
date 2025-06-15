import { authClient } from '@web/lib/auth-client';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button, buttonVariants } from './ui/button';
import { ThemeButton } from './theme-button';

export function SettingsHeader() {
  return (
    <div className='flex items-center gap-2 justify-between'>
      <Link to='/' className={buttonVariants({ variant: 'ghost' })}>
        <ArrowLeft className='h-4 w-4' />
        Go Back
      </Link>
      <div className="flex gap-2">
        <ThemeButton />
        <Button variant="outline" onClick={async () => {
          await authClient.signOut();
          window.location.href = '/';
        }}>
          Log out
        </Button>
      </div>
    </div>
  )
}
