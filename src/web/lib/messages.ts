import { id } from '@instantdb/react';
import { db } from '@web/lib/instant';
import type { Message, ParsedMessage } from '@web/lib/types';
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

export async function retryMessage(
  messages: ParsedMessage[],
  targetMessage: ParsedMessage,
  newContent: string,
  userId: string,
  model: ModelId,
  webSearchEnabled: boolean,
  reasoning: 'off' | 'low' | 'medium' | 'high',
) {
  let targetIndex = messages.findIndex(m => m.id === targetMessage.id);
  if (targetMessage.role === 'user') {
    targetIndex += 1;
  }
  const messagesToDelete = messages.slice(targetIndex);
  const deleteActions = messagesToDelete.map(m =>
    db.tx.messages[m.id].delete(),
  );
  const newAssistantMessage = createMessageObject({
    role: 'assistant',
    content: {},
    chatId: targetMessage.chatId,
    model: model,
  });
  const tx = [...deleteActions, createAssistantMessage(newAssistantMessage)];
  if (targetMessage.role === 'user') {
    tx.push(
      db.tx.messages[targetMessage.id].update({
        content: newContent,
        model: model,
        updatedAt: new Date().toISOString(),
      }),
    );
  }
  await db.transact(tx);

  const conversationUpToTarget = messages.slice(0, targetIndex);
  const messagesForApi = conversationUpToTarget.map(m =>
    messageToAPIMessage(m),
  );
  const previousResponseId =
    conversationUpToTarget[conversationUpToTarget.length - 2]?.responseId;
  return sendMessage({
    messages: messagesForApi,
    userId,
    messageId: newAssistantMessage.id,
    previousResponseId,
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
