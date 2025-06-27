import type { ErrorComponentProps } from '@tanstack/react-router';
import {
  createRootRouteWithContext,
  ErrorComponent,
  Outlet,
} from '@tanstack/react-router';
import { Providers } from '@web/components/providers';
import { Toaster } from '@web/components/ui/sonner';
import type { RootRouterContext } from '@web/router';

export const Route = createRootRouteWithContext<RootRouterContext>()({
  component: RootComponent,
  errorComponent: RootErrorComponent,
});

function RootComponent() {
  return (
    <Providers>
      <Outlet />
      <Toaster />
    </Providers>
  );
}

function RootErrorComponent({ error }: ErrorComponentProps) {
  if (error instanceof Error) {
    return <div>{error.message}</div>;
  }

  return <ErrorComponent error={error} />;
}
