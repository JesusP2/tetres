import { id } from '@instantdb/react';
import { db } from '@web/lib/instant';
import type { Message } from '@web/lib/types';
import { sendMessage } from '@web/services';
import type { ModelId } from '@server/utils/models';
import { createMessageObject, messageToAPIMessage } from './utils/message';

export function createUserMessage(message: Message) {
  const { files, ...rest } = message;
  return db.tx.messages[message.id].update(rest).link({ chat: message.chatId });
}

export function createAssistantMessage(message: Message) {
  const { files, ...rest } = message;
  return db.tx.messages[message.id]
    .update({
      ...rest,
      finished: null,
    })
    .link({ chat: message.chatId });
}

function getLastUserMessage(messages: { role: 'user' | 'assistant' }[]) {
  return messages[messages.length - 1]?.role === 'user'
    ? messages[messages.length - 1]
    : messages[messages.length - 2];
}

export async function retryMessage(
  messages: Message[],
  targetMessage: Message,
  newContent: string,
  userId: string,
  model: ModelId,
  webSearchEnabled: boolean,
  reasoning: 'off' | 'low' | 'medium' | 'high',
) {
  const targetIndex = messages.findIndex(m => m.id === targetMessage.id);
  const messagesToDelete = messages.slice(targetIndex + 1);
  const deleteActions = messagesToDelete.map(m =>
    db.tx.messages[m.id].delete(),
  );
  const newAssistantMessage = createMessageObject({
    role: 'assistant',
    content: {},
    chatId: targetMessage.chatId,
    model: model,
  });
  await db.transact([
    ...deleteActions,
    db.tx.messages[targetMessage.id].update({
      content: newContent,
      model: model,
      updatedAt: new Date().toISOString(),
    }),
    createAssistantMessage(newAssistantMessage),
  ]);

  const conversationUpToTarget = messages.slice(0, targetIndex + 1);
  const messagesForApi = conversationUpToTarget.map(m =>
    messageToAPIMessage(m),
  );
  return sendMessage({
    messages: messagesForApi,
    userId,
    messageId: newAssistantMessage.id,
    model: model,
    chatId: targetMessage.chatId,
    webSearchEnabled,
    reasoning,
  });
}

export async function uploadFile(file: File, userId: string) {
  const path = `${userId}/${id()}/${file.name}`;
  const { data } = await db.storage.uploadFile(path, file, {
    contentType: file.type,
    contentDisposition: 'attachment',
  });
  return data.id;
}

export async function abortGeneration(messageId: string) {
  const now = new Date().toISOString();
  return db.transact(
    db.tx.messages[messageId].update({
      aborted: now,
      finished: now,
    }),
  );
}
