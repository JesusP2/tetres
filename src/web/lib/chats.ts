import type { InstaQLEntity } from '@instantdb/react';
import { db } from '@web/lib/instant';
import schema from '../../../instant.schema';
import type { ModelId } from '@server/utils/models';

export type Chat = InstaQLEntity<typeof schema, 'chats'>;
export type Message = InstaQLEntity<typeof schema, 'messages'>;

export function createChat(user: { id: string }, name: string, chatId: string, model: ModelId) {
  return db.transact(
    db.tx.chats[chatId]
      .update({
        title: name,
        model,
        pinned: false,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .link({ user: user.id }),
  );
}

export function updateChatTitle(chat: Chat, title: string) {
  return db.transact(
    db.tx.chats[chat.id].update({
      title,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function updateChatModel(chat: Chat, model: ModelId) {
  return db.transact(
    db.tx.chats[chat.id].update({
      model,
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
