import { createFileRoute, Navigate } from '@tanstack/react-router';
import { Chat } from '@web/components/chat/index';
import { useChatMessages } from '@web/hooks/use-chat-messages';

export const Route = createFileRoute('/_chat/$chatId')({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    isLoading,
    parsedMessages,
    setParsedMessages,
    chat,
  } = useChatMessages();
  if (!isLoading && !chat) return <Navigate to='/' />;
  if (!chat) return null;

  return (
    <Chat
      chat={chat}
      messages={parsedMessages}
      setParsedMessages={setParsedMessages}
    />
  );
}
