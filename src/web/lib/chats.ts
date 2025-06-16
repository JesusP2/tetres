import { db } from '@web/lib/instant';
import type { ModelId } from '@server/utils/models';
import type { Chat } from './types';

export function createChat(
  user: { id: string },
  name: string,
  chatId: string,
  model: ModelId,
  projectId?: string,
) {
  const chatData = {
    title: name,
    model,
    pinned: false,
    userId: user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any;

  if (projectId) {
    chatData.projectId = projectId;
  }

  return db.tx.chats[chatId]
    .update(chatData)
    .link({ user: user.id });
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

export function updateChatProject(chat: Chat, projectId: string | null) {
  const updateData = {
    updatedAt: new Date().toISOString(),
  } as any;

  if (projectId) {
    updateData.projectId = projectId;
  } else {
    updateData.projectId = null;
  }

  return db.transact(
    db.tx.chats[chat.id].update(updateData),
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
