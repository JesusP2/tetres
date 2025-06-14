import { useParams } from '@tanstack/react-router';
import { db } from '@web/lib/instant';
import { renderMarkdown } from '@web/lib/syntax-highlighting';
import type { Chat, Message } from '@web/lib/types';
import { useEffect, useState } from 'react';

const objectToString = (obj: any): string => {
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object') {
    return Object.values(obj).join('');
  }
  return String(obj);
};
async function parseMessage(message: string) {
  return renderMarkdown(objectToString(message));
}

const parsedMessageCache = new Map<string, string>();

function createCacheKey(messageId: string, content: string) {
  const contentHash = content.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  return `${messageId}-${contentHash}`;
}

export function useChatMessages() {
  const { chatId } = useParams({ from: '/_chat/$chatId' });
  const { isLoading, data } = db.useQuery({
    chats: {
      $: { where: { id: chatId } },
      messages: {
        files: {},
      },
    },
  });

  const [parsedMessages, setParsedMessages] = useState<
    (Message & { highlightedText?: string })[]
  >([]);

  useEffect(() => {
    if (isLoading || !data?.chats[0]?.messages) {
      setParsedMessages([]);
      return;
    }
    const rawMessages = data.chats[0].messages as Message[];
    // Process messages and handle caching
    const processMessages = async () => {
      const processedMessages = await Promise.all(
        rawMessages.map(async message => {
          if (message.role === 'user') {
            return message;
          }
          const cacheKey = createCacheKey(
            message.id,
            objectToString(message.content),
          );
          if (parsedMessageCache.has(cacheKey)) {
            return {
              ...message,
              content: objectToString(message.content),
              highlightedText: parsedMessageCache.get(cacheKey)!,
            };
          }
          // Parse and cache
          const highlightedText = await parseMessage(message.content);
          parsedMessageCache.set(cacheKey, highlightedText);
          return {
            ...message,
            content: objectToString(message.content),
            highlightedText: highlightedText,
          };
        }),
      );
      processedMessages.sort(
        (a, b) =>
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      );
      setParsedMessages(processedMessages);
    };

    processMessages();
  }, [data?.chats[0]?.messages, isLoading, parseMessage, createCacheKey]);
  const chat = data?.chats[0] as Chat;

  return {
    isLoading,
    parsedMessages,
    setParsedMessages,
    chat,
  };
}
