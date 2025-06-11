import type { InstaQLEntity } from '@instantdb/react';
import { db } from '@web/lib/instant';
import schema from '../../../instant.schema';

export type Chat = InstaQLEntity<typeof schema, 'chats'>;

export function createChat(user: { id: string }, name: string, chatId: string) {
  return db.transact(
    db.tx.chats[chatId]
      .update({
        title: name,
        pinned: false,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .link({ user: user.id }),
  );
}

export function updateChat(chat: Chat, name: string) {
  return db.transact(
    db.tx.chats[chat.id].update({
      title: name,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function togglePin(chat: Chat) {
  return db.transact(
    db.tx.chats[chat.id].update({
      pinned: !chat.pinned,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function deleteChat(chat: Chat) {
  return db.transact(db.tx.chats[chat.id].delete());
}
