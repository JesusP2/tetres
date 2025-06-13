import { useParams } from '@tanstack/react-router';
import { db } from '@web/lib/instant';
import { renderMarkdown } from '@web/lib/syntax-highlighting';
import type { Message } from '@web/lib/types';
import { useCallback, useEffect, useState } from 'react';

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
  const [areChatsLoading, setAreChatsLoading] = useState(isLoading);

  const createCacheKey = useCallback((messageId: string, content: string) => {
    const contentHash = content.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `${messageId}-${contentHash}`;
  }, []);
  const [parsedMessages, setParsedMessages] = useState<(Message & { highlightedText?: string })[]>([]);

  useEffect(() => {
    if (isLoading || !data?.chats[0]?.messages) {
      setParsedMessages([]);
      return;
    }
    const rawMessages = data.chats[0].messages;
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
      setParsedMessages(processedMessages);
      setAreChatsLoading(false);
    };

    processMessages();
  }, [data?.chats[0]?.messages, isLoading, parseMessage, createCacheKey]);
  const chat = data?.chats[0];

  return {
    isLoading,
    areChatsLoading,
    parsedMessages,
    setParsedMessages,
    chat,
  };
}
