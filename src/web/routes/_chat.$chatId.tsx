import { createFileRoute, Navigate } from '@tanstack/react-router';
import { Chat } from '@web/components/chat/index';
import { useChatMessages } from '@web/hooks/use-chat-messages';

export const Route = createFileRoute('/_chat/$chatId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { chatId } = Route.useParams();
  const { isLoading, parsedMessages, setParsedMessages, chat } =
    useChatMessages(chatId);
  if (!isLoading && !chat) return <Navigate to='/' />;
  if (!chat) return null;

  return (
    <Chat
      chat={chat}
      areMessagesLoading={isLoading}
      messages={parsedMessages}
      setParsedMessages={setParsedMessages}
    />
  );
}
