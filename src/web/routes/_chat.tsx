import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ChatLayout } from '@web/components/chat/layout';

export const Route = createFileRoute('/_chat')({
  component: ChatRouteLayout,
});

function ChatRouteLayout() {
  return (
    <ChatLayout>
      <Outlet />
    </ChatLayout>
  );
}
