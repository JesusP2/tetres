import { id, InstaQLEntity } from '@instantdb/react';
import { db } from '@web/lib/instant';
import schema from '../../../instant.schema';

export type Message = InstaQLEntity<typeof schema, 'messages'>;

type CreateMessageInput = {
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
};

export async function saveMessage(messages: CreateMessageInput[], userId: string) {
  const lastMessage = messages[messages.length - 1];
  const body = {
    messages: messages.map(message => ({
      role: message.role,
      content: message.content,
    })),
    config: {
      model: 'google/gemini-2.5-flash-preview-05-20',
      userId,
      chatId: lastMessage.chatId,
    },
  };
  await fetch('/api/model', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  // if (!res.ok) {
  //   throw new Error('Failed to fetch model');
  // }
  // const reader = res.body?.getReader();
  // if (!reader) {
  //   throw new Error('Failed to get reader');
  // }
  // const decoder = new TextDecoder();
  // let accumulatedText = '';
  // while (true) {
  //   const { value, done } = await reader.read();
  //
  //   // 'done' is true when the stream is exhausted
  //   if (done) {
  //     console.log('Stream complete!');
  //     break;
  //   }
  //   const chunk = decoder.decode(value, { stream: true });
  //   accumulatedText += chunk;
  //   console.log('Received chunk:', accumulatedText);
  // }
  return db.transact(
    db.tx.messages[id()]
      .update({
        ...lastMessage,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .link({ chat: lastMessage.chatId }),
  );
}
