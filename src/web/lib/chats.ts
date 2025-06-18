import { id } from '@instantdb/react';
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
  sharedAt?: string,
  shareToken?: string,
) {
  return db.tx.chats[chatId]
    .update({
      title: name,
      model,
      pinned: false,
      userId: user.id,
      type: sharedAt ? 'shared' : 'private',
      branchId,
      projectId,
      sharedAt,
      shareToken,
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

export async function shareChat(
  chat: Chat,
  user: { id: string },
  messages: any[],
) {
  const shareToken = id();
  const sharedChatId = id();

  const createChatTx = createChat(
    user,
    chat.title,
    sharedChatId,
    chat.model as ModelId,
    undefined,
    undefined,
    new Date().toISOString(),
    shareToken,
  );

  // Copy all messages (similar to createNewBranch logic)
  const newMessageTxs = messages.map(msgToCopy => {
    const newMsgId = id();
    const {
      files,
      id: _id,
      chatId: _oldChatId,
      highlightedText: _oldHighlightedText,
      highlightedReasoning: _oldHighlightedReasoning,
      ...restOfMsg
    } = msgToCopy;
    const newMessageData = {
      ...restOfMsg,
      id: newMsgId,
      chatId: sharedChatId,
    };

    const links: { chat: string; files?: string[] } = { chat: sharedChatId };
    const fileIds = files?.map((f: any) => f.id);
    if (fileIds?.length) {
      links.files = fileIds;
    }
    return db.tx.messages[newMsgId].update(newMessageData).link(links);
  });

  await db.transact([createChatTx, ...newMessageTxs]);

  return {
    sharedChatId,
    shareToken,
    shareUrl: `${window.location.origin}/shared/${shareToken}`,
  };
}

// Copy a shared chat for personal editing (uses existing branch logic)
export async function copySharedChat(
  sharedChat: Chat,
  user: { id: string },
  messages: any[],
) {
  const newChatId = id();

  // Create new chat as a "branch" of the shared chat
  const createChatTx = createChat(
    user,
    sharedChat.title,
    newChatId,
    sharedChat.model as ModelId,
  );

  // Copy all messages from shared chat
  const newMessageTxs = messages.map(msgToCopy => {
    const newMsgId = id();
    const {
      files,
      id: _id,
      chatId: _oldChatId,
      highlightedText: _oldHighlightedText,
      highlightedReasoning: _oldHighlightedReasoning,
      ...restOfMsg
    } = msgToCopy;
    const newMessageData = {
      ...restOfMsg,
      id: newMsgId,
      chatId: newChatId,
    };

    const links: { chat: string; files?: string[] } = { chat: newChatId };
    const fileIds = files?.map((f: any) => f.id);
    if (fileIds?.length) {
      links.files = fileIds;
    }
    return db.tx.messages[newMsgId]!.update(newMessageData).link(links);
  });

  await db.transact([createChatTx, ...newMessageTxs]);

  return newChatId;
}

// Helper functions to check chat types
export function isSharedChat(chat: Chat): boolean {
  return chat.sharedAt != null;
}

export function isCopyOfSharedChat(chat: Chat): boolean {
  // Check if this is a branch of a shared chat would require a query
  // For now, we can use branchId presence as an indicator
  return chat.branchId != null;
}

export function isPrivateChat(chat: Chat): boolean {
  return chat.sharedAt == null && chat.branchId == null;
}
