import { createFileRoute, useParams } from '@tanstack/react-router'
import { Chat } from '@web/components/chat/index';
import { CodeBlock } from '@web/components/ui/code-block';
import { db } from '@web/lib/instant';
import { renderMarkdown } from '@web/lib/syntax-highlighting';
import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';

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
  const [idk, setIdk] = useState<any>(null);

  useEffect(() => {
    if (isLoading) return;
    const message = chat?.messages[3]
    console.log(message)
    if (!message) return;
    async function idk() {
      const html = await renderMarkdown(objectToString(message.content));
      setIdk(html)
    }
    idk()
  }, [isLoading])
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const chat = data.chats[0];
  const messages = chat?.messages.map(message => ({
    ...message,
    content: objectToString(message.content),
  }));
  return (<>
    {/*<div dangerouslySetInnerHTML={{ __html: idk }} />*/}
    <Chat chat={chat} messages={messages} />
  </>)
}

function objectToString(obj: any) {
  return Object.values(obj).join('');
}
