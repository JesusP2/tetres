import { id, type InstaQLEntity } from '@instantdb/react';
import { db } from '@web/lib/instant';
import type { ModelId } from '@server/utils/models';
import schema from '../../../instant.schema';

export type Message = InstaQLEntity<typeof schema, 'messages'>;

export type CreateMessageInput = {
  chatId: string;
  role: 'user' | 'assistant';
  content: any;
  model: ModelId;
};

export async function sendMessage({
  messages,
  userId,
  messageId,
  model,
  chatId,
}: {
  messages: { role: 'user' | 'assistant'; content: string | null }[];
  userId: string;
  messageId: string;
  model: ModelId;
  chatId: string;
}) {
  const body = {
    messages,
    config: {
      model,
      userId,
      chatId,
      messageId,
    },
  };
  await fetch('/api/model', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export function createUserMessage(
  message: CreateMessageInput,
  id: string,
  files: string[],
) {
  return db.tx.messages[id]
    .update({
      ...message,
      finished: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .link({ chat: message.chatId })
    .link({ $files: files });
}

export function createAssistantMessage(
  message: CreateMessageInput,
  id: string,
) {
  return db.tx.messages[id]
    .update({
      ...message,
      finished: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
) {
  const targetIndex = messages.findIndex(m => m.id === targetMessage.id);
  const messagesToDelete = messages.slice(targetIndex + 1);
  const deleteActions = messagesToDelete.map(m =>
    db.tx.messages[m.id].delete(),
  );
  const newAssitantMessageId = id();
  await db.transact([
    ...deleteActions,
    db.tx.messages[targetMessage.id].update({
      content: newContent,
      model: model,
      updatedAt: new Date().toISOString(),
    }),
    createAssistantMessage({
      chatId: targetMessage.chatId,
      content: null,
      model: model,
      role: 'assistant',
    }, newAssitantMessageId),
  ]);

  const conversationUpToTarget = messages.slice(0, targetIndex + 1);

  const messagesForAPI = conversationUpToTarget.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.id === targetMessage.id ? newContent : m.content,
  }));
  const lastUsersMessage = getLastUserMessage(messagesForAPI);
  if (!lastUsersMessage) {
    console.error('this should never happen');
    return;
  }

  return sendMessage({
    messages: messagesForAPI,
    userId,
    messageId: newAssitantMessageId,
    model: model,
    chatId: targetMessage.chatId,
  });
}

export function copyMessageToClipboard(message: Message) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(message.content);
  } else {
    // Fallback for non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = message.content;
    textArea.style.position = 'absolute';
    textArea.style.left = '-999999px';

    document.body.prepend(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
    } catch (error) {
      console.error('Failed to copy text: ', error);
    } finally {
      textArea.remove();
    }

    return Promise.resolve();
  }
}
export async function uploadFile(file: File, userId: string) {
  const path = `${userId}/${id()}-${file.name}`;
  const { data } = await db.storage.uploadFile(path, file, {
    contentType: file.type,
    contentDisposition: 'attachment',
  });
  return data.id;
}
