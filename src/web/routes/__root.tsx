import type { ErrorComponentProps } from '@tanstack/react-router';
import { createRootRouteWithContext, ErrorComponent, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Providers } from '../components/providers';
import type { RootRouterContext } from '../router.ts';

export const Route = createRootRouteWithContext<RootRouterContext>()({
  component: RootComponent,
  errorComponent: RootErrorComponent,
});

function RootComponent() {
  return (
    <Providers>
      <div className='root-content'>
        <Outlet />
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools position='bottom-right' />}
    </Providers>
  );
}

function RootErrorComponent({ error }: ErrorComponentProps) {
  if (error instanceof Error) {
    return <div>{error.message}</div>;
  }

  return <ErrorComponent error={error} />;
}
