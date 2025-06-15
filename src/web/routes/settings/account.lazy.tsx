import { zodResolver } from '@hookform/resolvers/zod';
import {
  createLazyFileRoute,
  Navigate,
  useNavigate,
} from '@tanstack/react-router';
import { DeleteAccountDialog } from '@web/components/delete-account-dialog';
import { useConfirmDialog } from '@web/components/providers/confirm-dialog-provider';
import { SettingsHeader } from '@web/components/settings-header';
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import { Button } from '@web/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@web/components/ui/form';
import { Input } from '@web/components/ui/input';
import { Separator } from '@web/components/ui/separator';
import { authClient } from '@web/lib/auth-client';
import { db } from '@web/lib/instant';
import { UploadButton } from '@web/lib/uploadthing';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

export const Route = createLazyFileRoute('/settings/account')({
  component: AccountSettings,
});

const changeUsernameSchema = z.object({
  name: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens',
    ),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
        'Password must contain an uppercase letter, a lowercase letter, a number, and a special character',
      ),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

function ChangeUsernameForm({ currentName }: { currentName: string }) {
  const form = useForm<z.infer<typeof changeUsernameSchema>>({
    resolver: zodResolver(changeUsernameSchema),
    defaultValues: {
      name: currentName,
    },
  });

  async function onSubmit(values: z.infer<typeof changeUsernameSchema>) {
    try {
      authClient.updateUser({
        name: values.name,
      });
      toast.success('Username updated successfully');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  className='max-w-xs'
                  placeholder='Your new username'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Save changes'}
        </Button>
      </form>
    </Form>
  );
}

function ChangePasswordForm() {
  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof changePasswordSchema>) {
    await authClient.changePassword(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: true,
      },
      {
        onSuccess: () => {
          toast.success('Password updated successfully');
          form.reset();
        },
        onError: ({ error }) => {
          toast.error(error.message);
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='currentPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <Input className='max-w-xs' type='password' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='newPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input className='max-w-xs' type='password' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input className='max-w-xs' type='password' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Save changes'}
        </Button>
      </form>
    </Form>
  );
}

function RevokeSessions() {
  const { confirmDelete } = useConfirmDialog();
  const navigate = useNavigate();

  const handleExpire = async () => {
    confirmDelete({
      title: 'Revoke All Sessions?',
      description:
        'This will log you out of all other devices. Are you sure you want to continue?',
      handleConfirm: async () => {
        await authClient.revokeSessions(undefined, {
          onSuccess: () => {
            toast.success('All other sessions have been expired.');
            navigate({ to: '/' });
          },
          onError: ({ error }) => {
            toast.error(error.message);
          },
        });
      },
    });
  };

  return (
    <div>
      <h3 className='text-lg font-medium'>Expire Sessions</h3>
      <p className='text-muted-foreground text-sm'>
        Log out of all other devices.
      </p>
      <Button onClick={handleExpire} className='mt-4'>
        Revoke all sessions
      </Button>
    </div>
  );
}

function AccountSettings() {
  const userQuery = db.useQuery({
    users: {},
  });

  if (userQuery.isLoading) {
    return <div>Loading...</div>;
  }

  const user = userQuery.data?.users[0];
  if (!userQuery.data || !user) {
    return <Navigate to='/auth/$id' params={{ id: 'sign-in' }} />;
  }

  return (
    <Card className='mx-auto max-w-3xl'>
      <CardHeader>
        <SettingsHeader />
        <CardTitle>Account</CardTitle>
        <CardDescription>Manage your account settings.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Avatar className='h-20 w-20'>
            <AvatarImage src={user.image ?? ''} />
            <AvatarFallback>{user.name?.[0]}</AvatarFallback>
          </Avatar>
          <UploadButton
            endpoint='uploader'
            onClientUploadComplete={async files => {
              const file = files[0];
              if (!file) {
                toast.error('Error uploading avatar: no file selected');
                return;
              }
              await db.transact(
                db.tx.users[user.id].update({
                  image: file.ufsUrl,
                }),
              );
              toast.success('Avatar updated successfully');
            }}
            onUploadError={(error: Error) => {
              toast.error(`Error uploading avatar: ${error.message}`);
            }}
          />
        </div>
        <Separator />
        <ChangeUsernameForm currentName={user.name ?? ''} />
        <Separator />
        <ChangePasswordForm />
        <Separator />
        <RevokeSessions />
        <Separator />
        <DeleteAccountDialog />
      </CardContent>
    </Card>
  );
}
