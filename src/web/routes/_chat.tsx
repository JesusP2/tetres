import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ChatAuthProvider } from '@web/components/chat/layout';

export const Route = createFileRoute('/_chat')({
  component: ChatRouteLayout,
});

function ChatRouteLayout() {
  return (
    <ChatAuthProvider>
      <Outlet />
    </ChatAuthProvider>
  );
}
