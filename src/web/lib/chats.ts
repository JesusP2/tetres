import { db } from '@web/lib/instant';
import { id, InstaQLEntity } from '@instantdb/react';
import schema from '../../../instant.schema';

export type Chat = InstaQLEntity<typeof schema, 'chats'>;

export function createChat(
  user: { id: string },
  name: string,
  chatId: string
) {
  db.transact(
    db.tx.chats[chatId].update({
      title: name,
      pinned: false,
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  );
}

export function updateChat(chat: Chat, name: string) {
  db.transact(
    db.tx.chats[chat.id].update({
      title: name,
      updatedAt: new Date().toISOString(),
    })
  );
}

export function togglePin(chat: Chat) {
  db.transact(
    db.tx.chats[chat.id].update({
      pinned: !chat.pinned,
      updatedAt: new Date().toISOString(),
    })
  );
}

export function deleteChat(chat: Chat) {
  db.transact(db.tx.chats[chat.id].delete());
} 
