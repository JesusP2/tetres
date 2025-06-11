import { createFileRoute, useParams } from '@tanstack/react-router'
import { Chat } from '@web/components/chat/index';
import { db } from '@web/lib/instant';
import { renderMarkdown } from '@web/lib/syntax-highlighting';
import { useEffect, useState, useCallback } from 'react';
import type { Message } from '@web/lib/types';

export const Route = createFileRoute('/_chat/$chatId')({
  component: RouteComponent,
});

// Create a cache for parsed messages to avoid re-parsing
const parsedMessageCache = new Map<string, string>();

function RouteComponent() {
  const { chatId } = useParams({ from: '/_chat/$chatId' });
  const {
    isLoading,
    error,
    data,
  } = db.useQuery({
    chats: {
      $: { where: { id: chatId } },
      messages: {
        $file: {}
      },
    },
  });
  const [areChatsLoading, setAreChatsLoading] = useState(isLoading);

  const parseMessage = useCallback(async (message: string) => {
    return renderMarkdown(objectToString(message));
  }, []);

  const createCacheKey = useCallback((messageId: string, content: string) => {
    const contentHash = content.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `${messageId}-${contentHash}`;
  }, []);
  const [parsedMessages, setParsedMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (isLoading || !data?.chats[0]?.messages) {
      setParsedMessages([]);
      return;
    }
    const rawMessages = data.chats[0].messages;
    // Process messages and handle caching
    const processMessages = async () => {
      const processedMessages = await Promise.all(
        rawMessages.map(async (message) => {
          if (message.role === 'user') {
            return message;
          }
          const cacheKey = createCacheKey(message.id, objectToString(message.content));
          if (parsedMessageCache.has(cacheKey)) {
            return {
              ...message,
              content: objectToString(message.content),
              parsedContent: parsedMessageCache.get(cacheKey)!
            };
          }
          // Parse and cache
          const parsedContent = await parseMessage(message.content);
          parsedMessageCache.set(cacheKey, parsedContent);
          return {
            ...message,
            content: objectToString(message.content),
            parsedContent
          };
        })
      );
      setParsedMessages(processedMessages);
      setAreChatsLoading(false);
    };

    processMessages();
  }, [data?.chats[0]?.messages, isLoading, parseMessage, createCacheKey]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const chat = data.chats[0];
  return <Chat areChatsLoading={areChatsLoading} chat={chat} messages={parsedMessages} setParsedMessages={setParsedMessages} />;
}

const objectToString = (obj: any): string => {
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object') {
    return Object.values(obj).join('');
  }
  return String(obj);
};
