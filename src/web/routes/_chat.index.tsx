import { createFileRoute } from '@tanstack/react-router'
import { Chat } from '@web/components/chat';

export const Route = createFileRoute('/_chat/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Chat />;
}
