import { db } from '@web/lib/instant';
import type { ModelId } from '@server/utils/models';
import type { Chat } from './types';

export function createChat(
  user: { id: string },
  name: string,
  chatId: string,
  model: ModelId,
  branchId?: string,
  projectId?: string,
) {
  return db.tx.chats[chatId]
    .update({
      title: name,
      model,
      pinned: false,
      userId: user.id,
      branchId,
      projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .link({ user: user.id });
}

export function updateChatTitle(chat: Chat, title: string) {
  return db.transact(
    db.tx.chats[chat.id].update({
      title,
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
