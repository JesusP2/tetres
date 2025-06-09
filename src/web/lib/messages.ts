import { id, InstaQLEntity } from '@instantdb/react';
import { db } from '@web/lib/instant';
import schema from '../../../instant.schema';

export type Message = InstaQLEntity<typeof schema, 'messages'>;

type CreateMessageInput = {
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
};

export function createMessage(message: CreateMessageInput) {
  return db.transact(
    db.tx.messages[id()]
      .update({
        ...message,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .link({ chat: message.chatId }),
  );
}

