import { ChatLayout } from '@web/components/chat-layout';
import { Outlet, createFileRoute } from '@tanstack/react-router';

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
