import { createFileRoute, useParams } from '@tanstack/react-router'
import { Chat } from '@web/components/chat/index';
import { db } from '@web/lib/instant';

export const Route = createFileRoute('/_chat/$chatId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { chatId } = useParams({ from: '/_chat/$chatId' });
  const {
    isLoading,
    error,
    data,
  } = db.useQuery({
    chats: {
      $: { where: { id: chatId } },
      messages: {},
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const chat = data.chats[0];
  const messages = chat?.messages.map(message => ({
    ...message,
    content: objectToString(message.content),
  }));
  return <Chat chat={chat} messages={messages} />;
}

function objectToString(obj: any) {
  return Object.values(obj).join('');
}
