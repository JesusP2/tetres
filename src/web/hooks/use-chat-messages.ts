import { db } from '@web/lib/instant';
import { renderMarkdown } from '@web/lib/syntax-highlighting';
import type { Chat, Message, ParsedMessage } from '@web/lib/types';
import { useEffect, useState } from 'react';

export const objectToString = (obj: any): string => {
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
const parsedReasoningCache = new Map<string, string>();

function createCacheKey(messageId: string, content: string) {
  const contentHash = content.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  return `${messageId}-${contentHash}`;
}

function createReasoningCacheKey(messageId: string, reasoning: string) {
  const reasoningHash = reasoning.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  return `${messageId}-reasoning-${reasoningHash}`;
}

export function useChatMessages(
  chatId: string,
  key: 'id' | 'shareToken' = 'id',
) {
  const { isLoading, data, ...rest } = db.useQuery({
    chats: {
      $: { where: { [key]: chatId } },
      messages: {
        files: {},
        $: {
          order: {
            updatedAt: 'asc',
          },
        },
      },
    },
  });
  console.log(data, rest)

  const [parsedMessages, setParsedMessages] = useState<ParsedMessage[]>([]);

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
          // if (message.role === 'user') {
          //   return message;
          // }

          // Parse content
          const cacheKey = createCacheKey(
            message.id,
            objectToString(message.content),
          );
          let highlightedText = '';
          if (parsedMessageCache.has(cacheKey)) {
            highlightedText = parsedMessageCache.get(cacheKey)!;
          } else {
            // Parse and cache
            highlightedText = await parseMessage(message.content);
            parsedMessageCache.set(cacheKey, highlightedText);
          }

          // Parse reasoning if it exists
          let highlightedReasoning = '';
          if (message.reasoning) {
            const reasoningString = objectToString(message.reasoning);
            if (reasoningString.trim()) {
              const reasoningCacheKey = createReasoningCacheKey(
                message.id,
                reasoningString,
              );
              if (parsedReasoningCache.has(reasoningCacheKey)) {
                highlightedReasoning =
                  parsedReasoningCache.get(reasoningCacheKey)!;
              } else {
                // Parse and cache reasoning
                highlightedReasoning = await parseMessage(reasoningString);
                parsedReasoningCache.set(
                  reasoningCacheKey,
                  highlightedReasoning,
                );
              }
            }
          }
          const newMessage = {
            ...message,
            content: objectToString(message.content),
            highlightedText: highlightedText,
            highlightedReasoning: highlightedReasoning,
          };
          if (message.reasoning) {
            newMessage.reasoning = objectToString(message.reasoning);
          }

          return newMessage;
        }),
      );
      setParsedMessages(processedMessages);
    };

    processMessages();
  }, [data?.chats[0]?.messages, isLoading]);
  const chat = data?.chats[0] as Chat;

  return {
    isLoading,
    parsedMessages,
    setParsedMessages,
    chat,
  };
}
